import { NextRequest, NextResponse } from 'next/server';
import { $Enums, PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: Fetch all assessments available for the student
export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Student access required' }, { status: 403 });
    }
    
    // Get student ID from query parameters or token
    const studentId = req.nextUrl.searchParams.get('studentId');
    
    // If studentId not provided in URL, get it from user token
    let student;
    if (!studentId) {
      student = await prisma.student.findFirst({
        where: { userId: decoded.id }
      });
      
      if (!student) {
        return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
      }
    } else {
      student = await prisma.student.findUnique({
        where: { id: studentId }
      });
      
      if (!student) {
        return NextResponse.json({ message: 'Student not found' }, { status: 404 });
      }
      
      // Security check: Students can only see their own assessments
      const requestingStudent = await prisma.student.findFirst({
        where: { userId: decoded.id }
      });
      
      if (requestingStudent?.id !== studentId) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }
    }
    
    // Get all courses the student is enrolled in
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE'
      },
      select: {
        courseId: true
      }
    });
    
    const courseIds = enrollments.map(enrollment => enrollment.courseId);
    
    // Get all subjects from these courses
    const subjects = await prisma.subject.findMany({
      where: {
        courseId: { in: courseIds }
      },
      select: {
        id: true
      }
    });
    
    const subjectIds = subjects.map(subject => subject.id);
    
    // Get assessments for these subjects
    const assessments = await prisma.assessment.findMany({
      where: {
        subjectId: { in: subjectIds }
      },
      include: {
        subject: {
          include: {
            course: true,
            faculty: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        },
        marks: {
          where: {
            studentId: student.id
          }
        }
      },
      orderBy: [
        { dueDate: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    // Transform assessments for response
    const today = new Date();
    const upcoming: { id: string; title: string; type: $Enums.AssessmentType; maxMarks: number; weightage: number; dueDate: Date | null; instructions: string | null; attachmentUrl: string | null; subjectName: string; subjectCode: string; courseName: string; facultyName: string; isSubmitted: boolean; isGraded: boolean; marksObtained: number | null; feedback: string | null; submissionId: string | null; submittedAt: Date | null; fileUrl: string | null; }[] = [];
    const past: { id: string; title: string; type: $Enums.AssessmentType; maxMarks: number; weightage: number; dueDate: Date | null; instructions: string | null; attachmentUrl: string | null; subjectName: string; subjectCode: string; courseName: string; facultyName: string; isSubmitted: boolean; isGraded: boolean; marksObtained: number | null; feedback: string | null; submissionId: string | null; submittedAt: Date | null; fileUrl: string | null; }[] = [];
    const completed: { id: string; title: string; type: $Enums.AssessmentType; maxMarks: number; weightage: number; dueDate: Date | null; instructions: string | null; attachmentUrl: string | null; subjectName: string; subjectCode: string; courseName: string; facultyName: string; isSubmitted: boolean; isGraded: boolean; marksObtained: number | null; feedback: string | null; submissionId: string | null; submittedAt: Date | null; fileUrl: string | null; }[] = [];
    
    assessments.forEach(assessment => {
      const submission = assessment.marks[0]; // Student's submission (if exists)
      const dueDate = assessment.dueDate ? new Date(assessment.dueDate) : null;
      const isPastDue = dueDate ? dueDate < today : false;
      
      const item = {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        maxMarks: assessment.maxMarks,
        weightage: assessment.weightage,
        dueDate: assessment.dueDate,
        instructions: assessment.instructions,
        attachmentUrl: assessment.attachmentUrl,
        subjectName: assessment.subject.name,
        subjectCode: assessment.subject.code,
        courseName: assessment.subject.course.name,
        facultyName: assessment.subject.faculty?.user.profile 
          ? `${assessment.subject.faculty.user.profile.firstName} ${assessment.subject.faculty.user.profile.lastName}`
          : "Unknown Faculty",
        isSubmitted: !!submission?.submittedAt,
        isGraded: !!submission?.evaluatedAt,
        marksObtained: submission?.marksObtained || null,
        feedback: submission?.feedback || null,
        submissionId: submission?.id || null,
        submittedAt: submission?.submittedAt || null,
        fileUrl: submission?.fileUrl || null
      };
      
      // Categorize the assessment
      if (submission?.submittedAt) {
        completed.push(item);
      } else if (isPastDue) {
        past.push(item);
      } else {
        upcoming.push(item);
      }
    });
    
    return NextResponse.json({
      upcoming,
      past,
      completed,
      stats: {
        total: assessments.length,
        completed: completed.length,
        pending: upcoming.length,
        missed: past.length
      }
    });
  } catch (error: any) {
    console.error('Assessment fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assessments', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
