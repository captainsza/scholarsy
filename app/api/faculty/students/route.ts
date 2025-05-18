import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUserFromToken } from '@/lib/jwt-utils'; // Assuming you have this utility

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromToken(req);

    if (!user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    if (user.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }

    const faculty = await prisma.faculty.findUnique({
      where: { userId: user.id },
    });

    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }

    // Get courses coordinated by the faculty
    const coordinatedCourses = await prisma.course.findMany({
      where: { facultyId: faculty.id },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            student: {
              include: {
                user: {
                  include: {
                    profile: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Get subjects taught by the faculty
    const taughtSubjects = await prisma.subject.findMany({
      where: { facultyId: faculty.id },
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
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const studentMap = new Map<string, any>();

    // Process students from coordinated courses
    coordinatedCourses.forEach(course => {
      course.enrollments.forEach(enrollment => {
        if (enrollment.student && enrollment.student.user?.profile) {
          if (!studentMap.has(enrollment.student.id)) {
            studentMap.set(enrollment.student.id, {
              id: enrollment.student.id,
              enrollmentId: enrollment.student.enrollmentId,
              firstName: enrollment.student.user.profile.firstName,
              lastName: enrollment.student.user.profile.lastName,
              email: enrollment.student.user.email,
              phone: enrollment.student.user.profile.phone,
              profileImage: enrollment.student.user.profile.profileImage,
              courses: [],
              subjects: [],
            });
          }
          studentMap.get(enrollment.student.id).courses.push({
            id: course.id,
            name: course.name,
            branch: course.branch,
            year: course.year,
            semester: course.semester,
          });
        }
      });
    });

    // Process students from taught subjects
    taughtSubjects.forEach(subject => {
      if (subject.course) {
        subject.course.enrollments.forEach(enrollment => {
          if (enrollment.student && enrollment.student.user?.profile) {
            if (!studentMap.has(enrollment.student.id)) {
              studentMap.set(enrollment.student.id, {
                id: enrollment.student.id,
                enrollmentId: enrollment.student.enrollmentId,
                firstName: enrollment.student.user.profile.firstName,
                lastName: enrollment.student.user.profile.lastName,
                email: enrollment.student.user.email,
                phone: enrollment.student.user.profile.phone,
                profileImage: enrollment.student.user.profile.profileImage,
                courses: [],
                subjects: [],
              });
            }
            // Add subject, ensuring not to duplicate course info if already added
            const studentEntry = studentMap.get(enrollment.student.id);
            studentEntry.subjects.push({
              id: subject.id,
              name: subject.name,
              code: subject.code,
              courseName: subject.course.name,
            });
            // Add course if not already present from coordinated courses
            if (!studentEntry.courses.some((c: any) => c.id === subject.courseId)) {
                 studentEntry.courses.push({
                    id: subject.course.id,
                    name: subject.course.name,
                    branch: subject.course.branch,
                    year: subject.course.year,
                    semester: subject.course.semester,
                 });
            }
          }
        });
      }
    });

    const students = Array.from(studentMap.values());

    return NextResponse.json({ students });

  } catch (error: any) {
    console.error('Failed to fetch faculty students:', error);
    return NextResponse.json({ message: 'Failed to fetch students', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
