import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        // Include subjects directly instead of going through sections
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
        // Count enrollments directly on the course
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
        // Include faculty information
        faculty: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        // Include schedules
        schedules: {
          include: {
            room: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Calculate some summary information
    const subjectsCount = course.subjects.length;
    const studentsCount = course.enrollments.length;
    
    // Transform the data to include the counts
    const courseWithCounts = {
      ...course,
      _count: {
        subjects: subjectsCount,
        students: studentsCount
      }
    };

    return NextResponse.json({ course: courseWithCounts });
  } catch (error: any) {
    console.error('Course fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch course', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Other methods (PUT, DELETE) would follow a similar pattern of updating
// to use direct relationships instead of sections
