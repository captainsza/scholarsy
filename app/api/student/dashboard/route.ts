import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { format, differenceInDays } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  console.log('Student dashboard API called');
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
    
    // Get the student record
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    console.log('Session user:', `ID: ${user.id}, Role: ${user.role}`);
    
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Student access required' }, { status: 403 });
    }

    const student = await prisma.student.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    if (!student) {
      return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
    }

    console.log('Student data retrieved:', `ID: ${student.id}, EnrollmentID: ${student.enrollmentId}`);

    // Get all registrations for the student (this is the older registration model)
    // This can be eventually phased out once fully migrated to courseEnrollment
    let registrations: any[] = [];
    try {
      // Wrap this in a try-catch to handle potential errors from null course references
      registrations = await prisma.registration.findMany({
        where: { studentId: student.id },
        include: {
          course: true,
        },
      });
    } catch (regError) {
      console.error('Error fetching registrations:', regError);
      // Continue execution with empty registrations
    }

    console.log('Retrieved', registrations.length, 'raw registrations');

    // Filter out invalid courses explicitly
    const validRegistrations = registrations.filter(registration => registration.course !== null);

    console.log('Found', validRegistrations.length, 'valid courses out of', registrations.length, 'registrations');

    // Calculate completion percentage
    // Logic: (current semester / total semesters) * 100
    let completionPercentage = 0;
    if (student.currentSemester && validRegistrations.length > 0) {
      const currentSem = parseInt(student.currentSemester);
      const totalSemesters = 8; // Assumption for example, can be configured
      completionPercentage = Math.round((currentSem / totalSemesters) * 100);
    }

    // Use courseEnrollments instead of sectionEnrollments
    const courseEnrollments = await prisma.courseEnrollment.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
      include: {
        course: {
          include: {
            schedules: {
              include: {
                room: true,
              }
            },
            faculty: {
              include: {
                user: {
                  include: {
                    profile: true,
                  }
                }
              }
            }
          }
        }
      }
    });

    // Get today's classes from active course enrollments
    const today = new Date();
    const dayName = format(today, 'EEEE'); // e.g., "Monday", "Tuesday", etc.
    
    const todayClasses = courseEnrollments
      .filter(enrollment => enrollment.course !== null)
      .flatMap(enrollment => {
        // Get the schedule items for this course that are on today
        return enrollment.course.schedules
          .filter(schedule => schedule.dayOfWeek === dayName)
          .map(schedule => ({
            id: schedule.id,
            courseId: enrollment.courseId,
            courseName: enrollment.course.name,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            roomName: schedule.room?.name || 'TBD',
            facultyName: enrollment.course.faculty?.user?.profile 
              ? `${enrollment.course.faculty.user.profile.firstName} ${enrollment.course.faculty.user.profile.lastName}` 
              : 'TBD',
          }));
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Get attendance data for active courses
    const attendanceSummary = await Promise.all(
      courseEnrollments.map(async (enrollment) => {
        const attendance = await prisma.attendance.findMany({
          where: { 
            studentId: student.id,
            courseId: enrollment.courseId,
          },
        });
        
        const total = attendance.length;
        const present = attendance.filter(a => a.status === 'PRESENT').length;
        const absent = attendance.filter(a => a.status === 'ABSENT').length;
        const late = attendance.filter(a => a.status === 'LATE').length;
        
        return {
          courseId: enrollment.courseId,
          courseName: enrollment.course.name,
          total,
          present,
          absent,
          late,
          percentage: total > 0 ? Math.round((present / total) * 100) : 0,
        };
      })
    );

    // Get recent attendance
    const recentAttendance = await prisma.attendance.findMany({
      where: { studentId: student.id },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        course: true,
      },
    });

    // Get profile completion percentage based on filled fields
    const profile = student.user.profile;
    const requiredFields = [
      'firstName', 'lastName', 'phone', 'gender', 'dob', 
      'fatherName', 'motherName', 'address', 'city', 'state'
    ];
    
    let filledFields = 0;
    for (const field of requiredFields) {
      if (profile && profile[field as keyof typeof profile]) {
        filledFields++;
      }
      else if (student[field as keyof typeof student]) {
        filledFields++;
      }
    }
    
    const profileCompletionPercentage = Math.round((filledFields / requiredFields.length) * 100);

    // Fetch upcoming assignments (limited to 5)
    const enrolledCourseIds = courseEnrollments.map(enrollment => enrollment.courseId);
    const upcomingAssignments = await prisma.assessment.findMany({
      where: {
        subject: {
          courseId: {
            in: enrolledCourseIds
          }
        },
        dueDate: {
          gt: new Date()  // Only future assignments
        }
      },
      orderBy: {
        dueDate: 'asc'  // Sort by closest due date first
      },
      take: 5,
      include: {
        subject: true,
        marks: {
          where: {
            studentId: student.id
          }
        }
      }
    });
    
    const formattedAssignments = upcomingAssignments.map(assessment => {
      const hasSubmitted = assessment.marks.length > 0;
      
      return {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        dueDate: assessment.dueDate,
        subjectName: assessment.subject.name,
        subjectCode: assessment.subject.code,
        isSubmitted: hasSubmitted
      };
    });

    // Format response data
    const responseData = {
      student: {
        id: student.id,
        name: profile ? `${profile.firstName} ${profile.lastName}` : student.enrollmentId,
        enrollmentId: student.enrollmentId,
        department: student.department,
        semester: student.currentSemester || 'N/A',
        profileImage: profile?.profileImage,
        completionPercentage,
        profileCompletionPercentage,
      },
      courses: courseEnrollments.map(enrollment => ({
        id: enrollment.courseId,
        name: enrollment.course.name,
        faculty: enrollment.course.faculty?.user?.profile 
          ? `${enrollment.course.faculty.user.profile.firstName} ${enrollment.course.faculty.user.profile.lastName}` 
          : 'TBD',
        enrolledOn: format(new Date(enrollment.enrolledAt), 'MMM dd, yyyy'),
      })),
      todayClasses,
      attendanceSummary,
      recentActivity: recentAttendance.map(record => ({
        id: record.id,
        date: format(new Date(record.date), 'MMM dd, yyyy'),
        status: record.status,
        courseName: record.course?.name || 'Unknown Course',
        daysAgo: differenceInDays(new Date(), new Date(record.date)),
      })),
      upcomingAssignments: formattedAssignments
    };

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Student dashboard data fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student dashboard data', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
