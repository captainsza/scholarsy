import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/session-utils'; // We'll create this utility

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  console.log('Faculty dashboard API called');
  try {
    // Get the current user from session
    let user;
    
    try {
      user = await getSessionUser(req);
    } catch (sessionError) {
      console.error('Session fetch failed:', sessionError);
      
      // Fallback to direct cookie parsing
      const token = req.cookies.get('auth-token')?.value;
      if (!token) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
      }
      
      // Try to get user directly from database
      user = await prisma.user.findFirst({
        where: {
          // This is where you'd decode the token and find the user
          // For now, just return an error
        }
      });
      
      if (!user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
      }
    }
    
    console.log('Session user:', user ? `ID: ${user.id}, Role: ${user.role}` : 'Not found');
    
    if (!user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Verify user is a faculty member
    if (user.role !== 'FACULTY') {
      console.log('Access denied - user role is', user.role);
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }
    
    // Get faculty record with user data
    const faculty = await prisma.faculty.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    console.log('Faculty data retrieved:', faculty ? `ID: ${faculty.id}, Name: ${faculty.user?.profile?.firstName}` : 'Not found');
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }

    // Get subjects taught by this faculty
    const subjects = await prisma.subject.findMany({
      where: { facultyId: faculty.id },
      include: {
        section: {
          include: {
            course: true,
            enrollments: {
              where: { status: 'ACTIVE' },
            },
            schedules: {
              include: { room: true },
            },
          },
        },
        assessments: true,
      },
    });
    console.log(`Retrieved ${subjects.length} subjects taught by faculty`);

    // Get courses coordinated by this faculty
    const coordinatedCourses = await prisma.course.findMany({
      where: { facultyId: faculty.id },
      include: {
        sections: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
            },
            subjects: true,
          },
        },
      },
    });
    console.log(`Retrieved ${coordinatedCourses.length} courses coordinated by faculty`);

    // Calculate total students (unique across all sections)
    const studentIdMap = new Map();
    subjects.forEach(subject => {
      if (subject.section?.enrollments) {
        subject.section.enrollments.forEach(enrollment => {
          studentIdMap.set(enrollment.studentId, true);
        });
      }
    });

    coordinatedCourses.forEach(course => {
      course.sections.forEach(section => {
        section.enrollments.forEach(enrollment => {
          studentIdMap.set(enrollment.studentId, true);
        });
      });
    });

    const totalStudents = studentIdMap.size;
    console.log('Total unique students:', totalStudents);

    // Calculate total courses taught (includes subjects and coordinated courses)
    const totalSubjects = subjects.length;
    const totalCourses = coordinatedCourses.length;
    console.log('Total subjects:', totalSubjects, 'Total coordinated courses:', totalCourses);

    // Calculate subjects with pending attendance (no attendance in the last week)
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    console.log('Checking attendance since:', oneWeekAgo.toISOString());

    // Get recent attendance records for this faculty's subjects
    const recentAttendance = await prisma.subjectAttendance.findMany({
      where: {
        subjectId: { in: subjects.map(subject => subject.id) },
        date: { gte: oneWeekAgo },
      },
      select: {
        subjectId: true,
        date: true,
      },
      distinct: ['subjectId', 'date'],
    });
    console.log(`Found ${recentAttendance.length} recent attendance records`);

    // Create a map of subjects with attendance
    const subjectsWithAttendance = new Map();
    recentAttendance.forEach(record => {
      if (!subjectsWithAttendance.has(record.subjectId)) {
        subjectsWithAttendance.set(record.subjectId, new Set());
      }
      subjectsWithAttendance.get(record.subjectId).add(record.date.toDateString());
    });

    // Count subjects without complete attendance
    let pendingAttendance = 0;
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    subjects.forEach(subject => {
      const daysWithAttendance = subjectsWithAttendance.get(subject.id)?.size || 0;
      // Assuming classes are held 5 days a week on weekdays
      const expectedDays = Math.min(5, Math.floor((now.getTime() - oneWeekAgo.getTime()) / (24 * 60 * 60 * 1000)));
      console.log(`Subject ${subject.code}: ${daysWithAttendance}/${expectedDays} days with attendance`);
      if (daysWithAttendance < expectedDays) {
        pendingAttendance++;
      }
    });
    console.log('Subjects with pending attendance:', pendingAttendance);

    // Calculate pending grades (assessments without complete marks)
    let pendingGrades = 0;
    
    // Get all assessments for this faculty's subjects
    const assessments = subjects.flatMap(subject => subject.assessments || []);
    console.log('Total assessments:', assessments.length);
    
    await Promise.all(assessments.map(async (assessment) => {
      // Get student count for this assessment's subject
      const subject = subjects.find(s => s.id === assessment.subjectId);
      const studentCount = subject?.section?.enrollments?.length || 0;
      
      // Get mark count for this assessment
      const markCount = await prisma.assessmentMark.count({
        where: {
          assessmentId: assessment.id,
        },
      });
      
      console.log(`Assessment ID ${assessment.id}: ${markCount}/${studentCount} marks recorded`);
      
      // If marks are missing for any student, count as pending
      if (markCount < studentCount) {
        pendingGrades++;
      }
    }));
    console.log('Assessments with pending grades:', pendingGrades);

    // Prepare course list data
    const courseList = subjects.map(subject => ({
      id: subject.id,
      code: subject.code,
      name: subject.name,
      section: subject.section?.name || "N/A",
      course: subject.section?.course?.name || "N/A",
      studentsCount: subject.section?.enrollments?.length || 0,
    }));

    // Get upcoming class schedules
    const today = new Date();
    const currentDayName = dayNames[today.getDay()];
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    console.log(`Current time: ${currentDayName} ${currentHour}:${currentMinute}`);
    
    // Collect all schedules from all sections of subjects taught by faculty
    const allSchedules = [];
    
    for (const subject of subjects) {
      if (subject.section?.schedules) {
        for (const schedule of subject.section.schedules) {
          // Add subject info to the schedule
          allSchedules.push({
            ...schedule,
            subjectName: subject.name,
            subjectCode: subject.code,
            sectionName: subject.section.name,
          });
        }
      }
    }
    console.log('Total schedules found:', allSchedules.length);
    
    // Filter and sort schedules
    const upcomingClasses = allSchedules
      .filter(schedule => {
        // Convert schedule time to comparable format
        const [scheduleHour, scheduleMinute] = schedule.startTime.split(':').map(Number);
        
        // If it's today, check if it's upcoming
        if (schedule.dayOfWeek === currentDayName) {
          return (scheduleHour > currentHour || 
                 (scheduleHour === currentHour && scheduleMinute > currentMinute));
        }
        
        // For other days, calculate if it's later in the week
        // Get the day index for the schedule
        const scheduleDayIndex = dayNames.indexOf(schedule.dayOfWeek);
        const todayIndex = today.getDay();
        
        // Calculate days ahead (handling week wraparound)
        const daysAhead = scheduleDayIndex >= todayIndex 
          ? scheduleDayIndex - todayIndex 
          : 7 - todayIndex + scheduleDayIndex;
        
        return daysAhead < 7; // Only include classes in the next 7 days
      })
      .sort((a, b) => {
        // First sort by day of week
        const aIdx = dayNames.indexOf(a.dayOfWeek);
        const bIdx = dayNames.indexOf(b.dayOfWeek);
        
        const aDayDiff = (aIdx >= today.getDay()) 
          ? aIdx - today.getDay() 
          : 7 - today.getDay() + aIdx;
          
        const bDayDiff = (bIdx >= today.getDay()) 
          ? bIdx - today.getDay() 
          : 7 - today.getDay() + bIdx;
          
        if (aDayDiff !== bDayDiff) return aDayDiff - bDayDiff;
        
        // Then sort by time
        const [aHour, aMinute] = a.startTime.split(':').map(Number);
        const [bHour, bMinute] = b.startTime.split(':').map(Number);
        
        if (aHour !== bHour) return aHour - bHour;
        return aMinute - bMinute;
      })
      .slice(0, 5) // Take the next 5 classes
      .map(schedule => ({
        id: schedule.id,
        courseName: `${schedule.subjectCode}: ${schedule.subjectName}`,
        sectionName: schedule.sectionName,
        roomName: schedule.room?.name || 'TBD',
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        dayOfWeek: schedule.dayOfWeek,
      }));
    console.log(`Found ${upcomingClasses.length} upcoming classes`);

    // Calculate attendance stats by subject
    const attendanceSummary: Record<string, { present: number, absent: number, late: number }> = {};
    
    await Promise.all(subjects.map(async (subject) => {
      const attendanceCounts = await prisma.subjectAttendance.groupBy({
        by: ['status'],
        where: {
          subjectId: subject.id,
        },
        _count: {
          status: true,
        },
      });

      const present = attendanceCounts.find(c => c.status === 'PRESENT')?._count?.status || 0;
      const absent = attendanceCounts.find(c => c.status === 'ABSENT')?._count?.status || 0;
      const late = attendanceCounts.find(c => c.status === 'LATE')?._count?.status || 0;
      
      console.log(`Attendance for ${subject.code}: Present=${present}, Absent=${absent}, Late=${late}`);
      attendanceSummary[`${subject.code}: ${subject.name}`] = { present, absent, late };
    }));

    console.log('Faculty dashboard data compiled successfully, sending response');
    // Return all dashboard data
    return NextResponse.json({
      facultyName: faculty.user.profile ? `${faculty.user.profile.firstName} ${faculty.user.profile.lastName}` : 'Unknown Faculty',
      department: faculty.department,
      totalStudents,
      totalCourses: totalSubjects + totalCourses,
      pendingAttendance,
      pendingGrades,
      courseList,
      upcomingClasses,
      attendanceSummary,
      recentActivity: {
        subjectCount: subjects.length,
        courseCount: coordinatedCourses.length,
        assessmentCount: assessments.length
      }
    });
  } catch (error: any) {
    console.error('Faculty dashboard data fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty dashboard data', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}