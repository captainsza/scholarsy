import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
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
    
    // Get student record
    const student = await prisma.student.findFirst({
      where: { userId: decoded.id }
    });
    
    if (!student) {
      return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
    }

    // Get assessment details
    const assessment = await prisma.assessment.findUnique({
      where: { id },
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
          where: { studentId: student.id }
        }
      }
    });
    
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    // Check if student is enrolled in the course
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: assessment.subject.courseId,
        status: 'ACTIVE'
      }
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { message: 'You are not enrolled in this course' }, 
        { status: 403 }
      );
    }
    
    const submission = assessment.marks[0];
    const today = new Date();
    const dueDate = assessment.dueDate ? new Date(assessment.dueDate) : null;
    const isPastDue = dueDate ? dueDate < today : false;
    
    const assessmentData = {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      maxMarks: assessment.maxMarks,
      weightage: assessment.weightage,
      dueDate: assessment.dueDate,
      instructions: assessment.instructions,
      attachmentUrl: assessment.attachmentUrl,
      isPastDue,
      
      subject: {
        id: assessment.subject.id,
        name: assessment.subject.name,
        code: assessment.subject.code,
      },
      
      course: {
        id: assessment.subject.course.id,
        name: assessment.subject.course.name
      },
      
      faculty: assessment.subject.faculty ? {
        name: assessment.subject.faculty.user.profile 
          ? `${assessment.subject.faculty.user.profile.firstName} ${assessment.subject.faculty.user.profile.lastName}`
          : "Unknown Faculty",
      } : null,
      
      submission: submission ? {
        id: submission.id,
        submittedAt: submission.submittedAt,
        evaluatedAt: submission.evaluatedAt,
        marksObtained: submission.marksObtained,
        feedback: submission.feedback,
        fileUrl: submission.fileUrl
      } : null
    };
    
    return NextResponse.json({ assessment: assessmentData });
  } catch (error: any) {
    console.error('Assessment detail fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assessment details', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
