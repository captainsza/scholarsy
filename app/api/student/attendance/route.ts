import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    const courseId = searchParams.get('courseId');
    
    if (!studentId) {
      return NextResponse.json({ message: 'Student ID is required' }, { status: 400 });
    }

    // Get all enrollments for the student
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId,
        status: 'ACTIVE',
        ...(courseId ? { courseId } : {})
      },
      include: {
        course: true
      }
    });

    // Extract courseIds from enrollments
    const courseIds = enrollments.map(enrollment => enrollment.courseId);

    // Get attendance records for these courses
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId,
        courseId: {
          in: courseIds
        }
      },
      orderBy: {
        date: 'desc'
      },
      include: {
        course: true
      }
    });

    // Calculate summary statistics per course
    const courseStats = await Promise.all(courseIds.map(async (courseId) => {
      const records = attendanceRecords.filter(record => record.courseId === courseId);
      const course = enrollments.find(e => e.courseId === courseId)?.course;
      
      if (!course) return null;
      
      const total = records.length;
      const present = records.filter(record => record.status === 'PRESENT').length;
      const absent = records.filter(record => record.status === 'ABSENT').length;
      const late = records.filter(record => record.status === 'LATE').length;
      
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return {
        courseId,
        courseName: course.name,
        courseCode: course.branch || "",
        total,
        present,
        absent,
        late,
        percentage
      };
    }));

    // Filter out null values if any
    const validCourseStats = courseStats.filter(Boolean);

    // Calculate overall attendance statistics
    const overallStats = {
      total: attendanceRecords.length,
      present: attendanceRecords.filter(record => record.status === 'PRESENT').length,
      absent: attendanceRecords.filter(record => record.status === 'ABSENT').length,
      late: attendanceRecords.filter(record => record.status === 'LATE').length,
    };
    
    overallStats.percentage = overallStats.total > 0 
      ? Math.round((overallStats.present / overallStats.total) * 100) 
      : 0;

    // Format attendance records for display
    const formattedRecords = attendanceRecords.map(record => ({
      id: record.id,
      date: format(new Date(record.date), 'yyyy-MM-dd'),
      formattedDate: format(new Date(record.date), 'MMM dd, yyyy'),
      status: record.status,
      courseId: record.courseId,
      courseName: record.course?.name || 'Unknown Course',
      courseCode: record.course?.branch || ''
    }));

    return NextResponse.json({
      records: formattedRecords,
      summary: overallStats,
      courseStats: validCourseStats
    });
  } catch (error) {
    console.error('Failed to fetch student attendance:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student attendance' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
