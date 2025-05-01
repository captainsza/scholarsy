import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json({ message: 'Faculty ID is required' }, { status: 400 });
    }

    // Get courses where faculty is assigned
    const courses = await prisma.course.findMany({
      where: {
        facultyId
      },
      include: {
        // Include subjects instead of sections
        subjects: {
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
        },
        enrollments: {
          where: {
            status: 'ACTIVE'
          }
        },
        schedules: {
          include: {
            room: true
          }
        }
      },
      orderBy: {
        name: "asc"
      }
    });

    // Get subjects taught by this faculty (even in courses they don't coordinate)
    const subjects = await prisma.subject.findMany({
      where: {
        facultyId
      },
      include: {
        course: true
      }
    });

    // Merge the subject courses into the main course list if not already included
    const allCourseIds = new Set(courses.map(course => course.id));
    
    const additionalCourses = await Promise.all(
      subjects
        .filter(subject => !allCourseIds.has(subject.courseId))
        .map(async (subject) => {
          return prisma.course.findUnique({
            where: { id: subject.courseId },
            include: {
              subjects: {
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
              },
              enrollments: {
                where: {
                  status: 'ACTIVE'
                }
              },
              schedules: {
                include: {
                  room: true
                }
              }
            }
          });
        })
    );

    // Filter out any null results and combine with courses
    const validAdditionalCourses = additionalCourses.filter(course => course !== null);
    const allCourses = [...courses, ...validAdditionalCourses];

    // Transform data for the response
    const transformedCourses = allCourses.map(course => ({
      id: course.id,
      name: course.name,
      code: course.branch,
      semester: `${course.semester} - ${course.year}`,
      description: course.description || '',
      isCoordinator: course.facultyId === facultyId,
      credits: course.credits || 0,
      subjectCount: course.subjects.length,
      studentCount: course.enrollments.length,
      subjects: course.subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        credits: subject.creditHours,
        isTaught: subject.facultyId === facultyId,
        facultyName: subject.faculty ? 
          `${subject.faculty.user?.profile?.firstName || ''} ${subject.faculty.user?.profile?.lastName || ''}`.trim() || 'Unassigned' 
          : 'Unassigned'
      })),
      schedule: course.schedules.map(schedule => ({
        id: schedule.id,
        day: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        roomName: schedule.room?.name || 'TBD'
      }))
    }));

    return NextResponse.json({ courses: transformedCourses });
  } catch (error) {
    console.error('Failed to fetch faculty courses:', error);
    return NextResponse.json({ message: 'Failed to fetch courses' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
