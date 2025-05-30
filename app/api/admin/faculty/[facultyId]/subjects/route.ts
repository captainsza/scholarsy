import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  try {
    const facultyId = params.facultyId;
    
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
    
    if (!['ADMIN', 'FACULTY'].includes(decoded.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // Get faculty with subjects
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        subjects: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                branch: true,
                year: true,
                semester: true,
                _count: {
                  select: {
                    enrollments: true
                  }
                }
              }
            },
            assessments: {
              select: {
                id: true,
                title: true,
                type: true,
                dueDate: true,
                maxMarks: true,
                createdAt: true
              },
              orderBy: {
                dueDate: 'desc'
              },
              take: 10
            },
            attendances: {
              select: {
                id: true,
                date: true,
                status: true,
                student: {
                  select: {
                    id: true,
                    enrollmentId: true,
                    user: {
                      select: {
                        profile: {
                          select: {
                            firstName: true,
                            lastName: true
                          }
                        }
                      }
                    }
                  }
                }
              },
              orderBy: {
                date: 'desc'
              },
              take: 20
            },
            classSchedules: {
              include: {
                room: true
              }
            },
            _count: {
              select: {
                assessments: true,
                attendances: true
              }
            }
          }
        }
      }
    });

    if (!faculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }

    // Calculate statistics for each subject
    const subjectsWithStats = faculty.subjects.map(subject => {
      const studentsCount = subject.course._count.enrollments;
      const assessmentsCount = subject._count.assessments;
      const attendanceCount = subject._count.attendances;
      
      // Calculate attendance percentage
      const totalAttendanceRecords = subject.attendances.length;
      const presentCount = subject.attendances.filter(a => a.status === 'PRESENT').length;
      const attendancePercentage = totalAttendanceRecords > 0 
        ? Math.round((presentCount / totalAttendanceRecords) * 100) 
        : 0;

      // Get recent assessments
      const recentAssessments = subject.assessments.slice(0, 5);
      
      // Get upcoming assessments
      const today = new Date();
      const upcomingAssessments = subject.assessments.filter(
        assessment => assessment.dueDate && new Date(assessment.dueDate) > today
      );

      return {
        ...subject,
        studentsCount,
        assessmentsCount,
        attendanceCount,
        attendancePercentage,
        recentAssessments,
        upcomingAssessments: upcomingAssessments.slice(0, 3)
      };
    });

    const response = {
      faculty: {
        id: faculty.id,
        department: faculty.department,
        user: faculty.user
      },
      subjects: subjectsWithStats,
      totalSubjects: faculty.subjects.length,
      totalAssessments: faculty.subjects.reduce((sum, s) => sum + s._count.assessments, 0),
      totalStudents: faculty.subjects.reduce((sum, s) => sum + s.course._count.enrollments, 0)
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Faculty subjects fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty subjects' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Assign faculty to a subject
export async function POST(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  try {
    const facultyId = params.facultyId;
    
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

    const { subjectId } = await req.json();

    if (!subjectId) {
      return NextResponse.json(
        { message: 'Subject ID is required' }, 
        { status: 400 }
      );
    }

    // Verify faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    });

    if (!faculty) {
      return NextResponse.json(
        { message: 'Faculty not found' }, 
        { status: 404 }
      );
    }

    // Verify subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        course: true
      }
    });

    if (!subject) {
      return NextResponse.json(
        { message: 'Subject not found' }, 
        { status: 404 }
      );
    }

    // Assign faculty to subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: { facultyId: facultyId },
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
        course: true
      }
    });

    return NextResponse.json({
      message: 'Faculty assigned to subject successfully',
      subject: updatedSubject
    });
  } catch (error: any) {
    console.error('Faculty subject assignment error:', error);
    return NextResponse.json(
      { message: 'Failed to assign faculty to subject' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE - Remove faculty from a subject
export async function DELETE(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  try {
    const facultyId = params.facultyId;
    const { searchParams } = req.nextUrl;
    const subjectId = searchParams.get('subjectId');
    
    if (!subjectId) {
      return NextResponse.json(
        { message: 'Subject ID is required' }, 
        { status: 400 }
      );
    }

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

    // Remove faculty from subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: { facultyId: null },
      include: {
        course: true
      }
    });

    return NextResponse.json({
      message: 'Faculty removed from subject successfully',
      subject: updatedSubject
    });
  } catch (error: any) {
    console.error('Faculty subject removal error:', error);
    return NextResponse.json(
      { message: 'Failed to remove faculty from subject' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
