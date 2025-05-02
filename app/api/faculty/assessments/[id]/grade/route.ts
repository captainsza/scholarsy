import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// POST: Grade a student's assessment submission
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: assessmentId } = params;
    
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
    
    if (decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }
    
    // Get faculty record
    const faculty = await prisma.faculty.findFirst({
      where: { userId: decoded.id }
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }
    
    // Parse request body
    const { studentId, marksObtained, feedback, markId } = await req.json();
    
    if (!studentId || marksObtained === undefined) {
      return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
    }
    
    // Check if assessment exists and belongs to this faculty
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { subject: true }
    });
    
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    // Security check: Faculty can only grade their own assessments
    if (assessment.subject.facultyId !== faculty.id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    
    // Validate that marks are within range
    if (marksObtained < 0 || marksObtained > assessment.maxMarks) {
      return NextResponse.json(
        { message: `Marks must be between 0 and ${assessment.maxMarks}` }, 
        { status: 400 }
      );
    }
    
    let gradedSubmission;
    
    // If markId is provided, update existing record
    if (markId) {
      gradedSubmission = await prisma.assessmentMark.update({
        where: { id: markId },
        data: {
          marksObtained: parseFloat(marksObtained),
          feedback,
          evaluatedAt: new Date()
        },
        include: {
          student: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          }
        }
      });
    } else {
      // Otherwise create a new mark record
      gradedSubmission = await prisma.assessmentMark.create({
        data: {
          assessmentId,
          studentId,
          marksObtained: parseFloat(marksObtained),
          feedback,
          evaluatedAt: new Date()
        },
        include: {
          student: {
            include: {
              user: {
                include: {
                  profile: true
                }
              }
            }
          }
        }
      });
    }
    
    return NextResponse.json({
      message: 'Assessment graded successfully',
      gradedSubmission: {
        id: gradedSubmission.id,
        marksObtained: gradedSubmission.marksObtained,
        feedback: gradedSubmission.feedback,
        evaluatedAt: gradedSubmission.evaluatedAt,
        studentName: gradedSubmission.student.user.profile ? 
          `${gradedSubmission.student.user.profile.firstName} ${gradedSubmission.student.user.profile.lastName}` :
          gradedSubmission.student.enrollmentId,
        enrollmentId: gradedSubmission.student.enrollmentId
      }
    });
  } catch (error: any) {
    console.error('Assessment grading error:', error);
    return NextResponse.json(
      { message: 'Failed to grade assessment', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
