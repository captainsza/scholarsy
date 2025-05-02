import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET: Fetch a specific assessment by ID
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
    
    // Fetch the assessment with detailed information
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: {
        subject: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: { status: 'ACTIVE' },
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
                }
              }
            }
          }
        },
        marks: {
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
        }
      }
    });
    
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    // Security check: Faculty can only see their own assessments
    if (assessment.subject.facultyId !== faculty.id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    
    // Transform the data for response
    const transformedAssessment = {
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      maxMarks: assessment.maxMarks,
      weightage: assessment.weightage,
      dueDate: assessment.dueDate,
      instructions: assessment.instructions,
      attachmentUrl: assessment.attachmentUrl,
      createdAt: assessment.createdAt,
      subject: {
        id: assessment.subject.id,
        name: assessment.subject.name,
        code: assessment.subject.code,
        course: {
          id: assessment.subject.course.id,
          name: assessment.subject.course.name,
          branch: assessment.subject.course.branch,
          year: assessment.subject.course.year,
          semester: assessment.subject.course.semester
        }
      },
      students: assessment.subject.course.enrollments.map(enrollment => {
        const submission = assessment.marks.find(mark => mark.studentId === enrollment.student.id);
        return {
          id: enrollment.student.id,
          name: enrollment.student.user.profile 
            ? `${enrollment.student.user.profile.firstName} ${enrollment.student.user.profile.lastName}`
            : enrollment.student.enrollmentId,
          enrollmentId: enrollment.student.enrollmentId,
          profileImage: enrollment.student.user.profile?.profileImage,
          submission: submission ? {
            id: submission.id,
            marksObtained: submission.marksObtained,
            feedback: submission.feedback,
            submittedAt: submission.submittedAt,
            evaluatedAt: submission.evaluatedAt,
            fileUrl: submission.fileUrl
          } : null
        };
      }),
      stats: {
        totalStudents: assessment.subject.course.enrollments.length,
        submittedCount: assessment.marks.filter(mark => mark.submittedAt).length,
        gradedCount: assessment.marks.filter(mark => mark.evaluatedAt).length,
        averageMarks: assessment.marks.length > 0 
          ? assessment.marks.reduce((sum, mark) => sum + mark.marksObtained, 0) / assessment.marks.length
          : 0
      }
    };
    
    return NextResponse.json({ assessment: transformedAssessment });
  } catch (error: any) {
    console.error('Assessment fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assessment details', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Update an assessment
export async function PUT(
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
    
    // Check if assessment exists and belongs to this faculty
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { subject: true }
    });
    
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    // Security check: Faculty can only update their own assessments
    if (assessment.subject.facultyId !== faculty.id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    
    // Parse update data from request
    const data = await req.json();
    const { title, type, maxMarks, weightage, dueDate, instructions } = data;
    
    // Update the assessment
    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(maxMarks !== undefined && { maxMarks: parseFloat(maxMarks) }),
        ...(weightage !== undefined && { weightage: parseFloat(weightage) }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(instructions !== undefined && { instructions })
      }
    });
    
    return NextResponse.json({
      message: 'Assessment updated successfully',
      assessment: updatedAssessment
    });
  } catch (error: any) {
    console.error('Assessment update error:', error);
    return NextResponse.json(
      { message: 'Failed to update assessment', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Delete an assessment
export async function DELETE(
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
    
    // Check if assessment exists and belongs to this faculty
    const assessment = await prisma.assessment.findUnique({
      where: { id },
      include: { subject: true }
    });
    
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    // Security check: Faculty can only delete their own assessments
    if (assessment.subject.facultyId !== faculty.id) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    
    // Delete all marks and then the assessment (cascading delete)
    await prisma.$transaction([
      prisma.assessmentMark.deleteMany({ where: { assessmentId: id } }),
      prisma.assessment.delete({ where: { id } })
    ]);
    
    return NextResponse.json({ message: 'Assessment deleted successfully' });
  } catch (error: any) {
    console.error('Assessment deletion error:', error);
    return NextResponse.json(
      { message: 'Failed to delete assessment', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
