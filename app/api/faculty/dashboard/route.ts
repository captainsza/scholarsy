import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Verify authentication - fix by awaiting cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
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
    
    // Get the faculty record
    const faculty = await prisma.faculty.findFirst({
      where: { userId: decoded.id }
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }

    // Get all courses taught by this faculty (assumed from schedules for now)
    const schedules = await prisma.schedule.findMany({
      where: { facultyId: faculty.id },
      include: { room: true },
      orderBy: { startTime: 'asc' }
    });

    // Extract unique course names from schedules
    const courseNames = [...new Set(schedules.map(schedule => schedule.courseName))];

    // Get course details
    const courses = await prisma.course.findMany({
      where: { name: { in: courseNames } },
    });

    // Get total students
    let totalStudents = 0;
    
    // Structure for courseList
    const courseList = await Promise.all(courses.map(async course => {
      // Count students in this course
      const registrations = await prisma.registration.count({
        where: { courseId: course.id }
      });
      
      totalStudents += registrations;
      
      return {
        id: course.id,
        code: course.code,
        name: course.name,
        studentsCount: registrations
      };
    }));

    // Get pending attendance count
    // For simplicity, we'll assume each course should have attendance records for the last 7 days
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    let pendingAttendance = 0;
    
    for (const course of courses) {
      const registrations = await prisma.registration.count({
        where: { courseId: course.id }
      });
      
      const attendanceEntries = await prisma.attendance.count({
        where: {
          courseId: course.id,
          date: { gte: sevenDaysAgo }
        }
      });
      
      // Calculate expected attendance (registrations * days)
      const expectedAttendance = registrations * 7;
      pendingAttendance += Math.max(0, expectedAttendance - attendanceEntries);
    }

    // Get pending grades count - fix the Prisma error by using isNull filter
    const pendingGrades = await prisma.gradeRecord.count({
      where: {
        facultyId: faculty.id,
        totalMark: {
          equals: undefined  // This is the correct way to check for null in Prisma
        }
      }
    });

    // Format upcoming classes
    const today2 = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = daysOfWeek[today2.getDay()];
    
    const upcomingClasses = schedules
      .filter(schedule => schedule.dayOfWeek === currentDayName || 
                          daysOfWeek.indexOf(schedule.dayOfWeek) > daysOfWeek.indexOf(currentDayName))
      .slice(0, 5) // Take only the next 5 classes
      .map(schedule => ({
        id: schedule.id,
        courseName: schedule.courseName,
        roomName: schedule.room?.name || 'Unknown Room',
        startTime: schedule.startTime.toISOString(),
        endTime: schedule.endTime.toISOString(),
        dayOfWeek: schedule.dayOfWeek
      }));

    // Get attendance summary by course
    const attendanceSummary: Record<string, { present: number, absent: number, late: number }> = {};
    
    for (const course of courses) {
      // Get attendance statistics for this course
      const presentCount = await prisma.attendance.count({
        where: {
          courseId: course.id,
          status: 'PRESENT'
        }
      });
      
      const absentCount = await prisma.attendance.count({
        where: {
          courseId: course.id,
          status: 'ABSENT'
        }
      });
      
      const lateCount = await prisma.attendance.count({
        where: {
          courseId: course.id,
          status: 'LATE'
        }
      });
      
      attendanceSummary[course.name] = {
        present: presentCount,
        absent: absentCount,
        late: lateCount
      };
    }

    // Return all dashboard data
    return NextResponse.json({
      totalStudents,
      totalCourses: courses.length,
      pendingAttendance,
      pendingGrades,
      courseList,
      upcomingClasses,
      attendanceSummary
    });
  } catch (error: any) {
    console.error('Faculty dashboard data fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty dashboard data' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}