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

    // Get faculty with courses and subjects
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          include: {
            profile: true
          }
        },
        courses: {
          include: {
            subjects: {
              where: {
                facultyId: facultyId
              },
              select: {
                id: true,
                name: true,
                code: true,
                creditHours: true
              }
            },
            enrollments: {
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
            },
            schedules: {
              where: {
                subject: {
                  facultyId: facultyId
                }
              },
              include: {
                room: true,
                subject: true
              }
            },
            _count: {
              select: {
                enrollments: true,
                subjects: true
              }
            }
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
                semester: true
              }
            },
            assessments: {
              select: {
                id: true,
                title: true,
                type: true,
                dueDate: true,
                maxMarks: true
              },
              orderBy: {
                dueDate: 'desc'
              },
              take: 5
            },
            _count: {
              select: {
                attendances: true,
                assessments: true
              }
            }
          }
        }
      }
    });

    if (!faculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }

    // Get unique courses where faculty teaches subjects
    const coursesWithSubjects = faculty.subjects.reduce((acc, subject) => {
      const courseId = subject.course.id;
      if (!acc[courseId]) {
        acc[courseId] = {
          ...subject.course,
          subjects: [],
          totalAssessments: 0,
          totalAttendances: 0
        };
      }
      acc[courseId].subjects.push({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        creditHours: subject.creditHours,
        assessments: subject.assessments,
        _count: subject._count
      });
      acc[courseId].totalAssessments += subject._count.assessments;
      acc[courseId].totalAttendances += subject._count.attendances;
      return acc;
    }, {} as any);

    // Combine with directly assigned courses
    const allCourses = [...faculty.courses];
    
    // Add courses from subjects that aren't directly assigned
    Object.values(coursesWithSubjects).forEach((course: any) => {
      if (!allCourses.find(c => c.id === course.id)) {
        allCourses.push(course);
      }
    });

    const response = {
      faculty: {
        id: faculty.id,
        department: faculty.department,
        user: faculty.user
      },
      courses: allCourses,
      coursesWithSubjects: Object.values(coursesWithSubjects),
      totalCourses: allCourses.length,
      totalSubjects: faculty.subjects.length
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Faculty courses fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty courses' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - Assign faculty to a course
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

    const { courseId } = await req.json();

    if (!courseId) {
      return NextResponse.json(
        { message: 'Course ID is required' }, 
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

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' }, 
        { status: 404 }
      );
    }

    // Assign faculty to course
    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
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
        }
      }
    });

    return NextResponse.json({
      message: 'Faculty assigned to course successfully',
      course: updatedCourse
    });
  } catch (error: any) {
    console.error('Faculty course assignment error:', error);
    return NextResponse.json(
      { message: 'Failed to assign faculty to course' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
