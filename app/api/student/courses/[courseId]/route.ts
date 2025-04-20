import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET: Retrieve details for a specific course the student is enrolled in
export async function GET(
  req: NextRequest,
  context: { params: { courseId: string } }
) {
  console.log('GET request received for course details');
  
  // Fix: Properly access courseId from params
  const courseId = context.params.courseId;
  const studentId = req.nextUrl.searchParams.get('studentId');

  console.log('Parameters:', { courseId, studentId });
  
  if (!courseId || !studentId) {
    return NextResponse.json({ message: 'Course ID and Student ID are required' }, { status: 400 });
  }

  try {
    // Find the enrollment for this student in this course, using courseEnrollment instead of sectionEnrollment
    console.log('Finding enrollment...');
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        studentId,
        courseId
      }
    });

    if (!enrollment) {
      return NextResponse.json({ message: 'Student not enrolled in this course' }, { status: 404 });
    }

    // Fetch the course with related data
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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
        schedules: {
          include: {
            room: true
          }
        },
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
            },
            assessments: true
          }
        }
      }
    });

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Get attendance records for this student in this course
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId,
        courseId
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Calculate attendance percentage
    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(record => record.status === 'PRESENT').length;
    const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    // Get assignments for this course
    const assignments = await prisma.assignment.findMany({
      where: {
        courseId
      },
      include: {
        submissions: {
          where: {
            studentId
          }
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    });

    // Format the response
    const formattedResponse = {
      id: course.id,
      name: course.name,
      branch: course.branch,
      year: course.year,
      semester: course.semester,
      description: course.description,
      credits: course.credits,
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt
      },
      faculty: course.faculty ? {
        id: course.faculty.id,
        name: course.faculty.user.profile 
          ? `${course.faculty.user.profile.firstName} ${course.faculty.user.profile.lastName}`
          : 'Unknown',
        profileImage: course.faculty.user.profile?.profileImage
      } : null,
      schedule: course.schedules.map(schedule => ({
        id: schedule.id,
        day: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room ? schedule.room.name : 'TBD'
      })),
      subjects: course.subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        creditHours: subject.creditHours,
        faculty: subject.faculty ? {
          name: subject.faculty.user.profile 
            ? `${subject.faculty.user.profile.firstName} ${subject.faculty.user.profile.lastName}`
            : 'Unknown'
        } : null,
        assessmentCount: subject.assessments.length
      })),
      attendance: {
        percentage: attendancePercentage,
        total: totalClasses,
        present: presentClasses,
        absent: attendanceRecords.filter(record => record.status === 'ABSENT').length,
        late: attendanceRecords.filter(record => record.status === 'LATE').length,
        recentRecords: attendanceRecords.slice(0, 5).map(record => ({
          id: record.id,
          date: record.date,
          status: record.status
        }))
      },
      assignments: assignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        dueDate: assignment.dueDate,
        isSubmitted: assignment.submissions.length > 0,
        submissionDate: assignment.submissions[0]?.submittedAt || null,
        grade: assignment.submissions[0]?.grade || null
      }))
    };

    return NextResponse.json(formattedResponse);
  } catch (error) {
    console.error('Failed to fetch course details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch course details' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
