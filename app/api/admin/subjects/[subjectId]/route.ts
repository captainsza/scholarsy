import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
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
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const subjectId = params.subjectId;

    // Fetch the subject with related data
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        faculty: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        course: true,
        assessments: {
          orderBy: {
            dueDate: 'asc'
          }
        },
        // Find students enrolled in the subject's course
        // Replace with actual attendance data when available
        attendances: {
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
          },
          take: 10 // Limit to recent attendances
        }
      }
    });

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    }

    // Get students enrolled in this course
    const enrolledStudents = await prisma.courseEnrollment.findMany({
      where: {
        courseId: subject.courseId,
        status: 'ACTIVE'
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
      },
      orderBy: {
        student: {
          enrollmentId: 'asc'
        }
      }
    });

    // Get class schedules for this subject
    const schedules = await prisma.classSchedule.findMany({
      where: {
        courseId: subject.courseId
      },
      include: {
        room: true
      }
    });

    return NextResponse.json({
      subject,
      enrolledStudents,
      schedules
    });
  } catch (error: any) {
    console.error('Subject fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subject details', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
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
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const subjectId = params.subjectId;
    const { name, code, description, creditHours, facultyId } = await req.json();

    // Update the subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name,
        code,
        description,
        creditHours,
        facultyId: facultyId === "none" ? null : facultyId
      }
    });

    return NextResponse.json(updatedSubject);
  } catch (error: any) {
    console.error('Subject update error:', error);
    return NextResponse.json(
      { message: 'Failed to update subject', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
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
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const subjectId = params.subjectId;

    // Delete subject (will cascade to related records based on your schema)
    await prisma.subject.delete({
      where: { id: subjectId }
    });

    return NextResponse.json({ message: 'Subject deleted successfully' });
  } catch (error: any) {
    console.error('Subject deletion error:', error);
    return NextResponse.json(
      { message: 'Failed to delete subject', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
