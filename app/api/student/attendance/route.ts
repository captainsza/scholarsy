import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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
    
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Student access required' }, { status: 403 });
    }

    // Get URL parameters - either use from URL or from token
    const studentId = req.nextUrl.searchParams.get('studentId');
    
    // Validate the request is for the authenticated student
    const student = await prisma.student.findFirst({
      where: { userId: decoded.id }
    });
    
    if (!student) {
      return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
    }
    
    // Verify the requested studentId matches the authenticated user
    if (studentId && studentId !== student.id) {
      return NextResponse.json({ message: 'Unauthorized access to another student\'s data' }, { status: 403 });
    }
    
    // Get current date for finding today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all course enrollments for the student
    const courseEnrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId: student.id,
        status: 'ACTIVE'
      },
      include: {
        course: {
          include: {
            subjects: true
          }
        }
      }
    });

    // Get attendance for each subject
    const subjects = [];
    const todayAttendance = [];
    
    for (const enrollment of courseEnrollments) {
      for (const subject of enrollment.course.subjects) {
        // Get all attendance records for this subject
        const attendanceRecords = await prisma.subjectAttendance.findMany({
          where: {
            studentId: student.id,
            subjectId: subject.id
          },
          orderBy: {
            date: 'desc'
          }
        });
        
        // Check for today's attendance
        const todayRecord = attendanceRecords.find(record => 
          record.date >= today && record.date < tomorrow
        );
        
        if (todayRecord) {
          todayAttendance.push({
            id: todayRecord.id,
            subjectId: subject.id,
            subjectName: subject.name,
            subjectCode: subject.code,
            status: todayRecord.status,
            date: todayRecord.date,
            remarks: todayRecord.remarks
          });
        }
        
        // Calculate stats
        const presentCount = attendanceRecords.filter(record => record.status === 'PRESENT').length;
        const absentCount = attendanceRecords.filter(record => record.status === 'ABSENT').length;
        const lateCount = attendanceRecords.filter(record => record.status === 'LATE').length;
        const totalCount = attendanceRecords.length;
        const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;
        
        subjects.push({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          courseId: enrollment.courseId,
          courseName: enrollment.course.name,
          attendanceRecords: attendanceRecords.map(record => ({
            id: record.id,
            date: record.date,
            status: record.status,
            remarks: record.remarks
          })),
          stats: {
            presentCount,
            absentCount,
            lateCount,
            totalCount,
            percentage
          },
          lastUpdated: attendanceRecords.length > 0 ? attendanceRecords[0].date : new Date()
        });
      }
    }
    
    // Calculate monthly attendance
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    
    // Get all attendance records for the current month
    const monthlyAttendanceRecords = await prisma.subjectAttendance.findMany({
      where: {
        studentId: student.id,
        date: {
          gte: firstDayOfMonth,
          lt: tomorrow
        }
      },
      orderBy: {
        date: 'desc'
      }
    });
    
    // Calculate monthly stats
    const monthlyPresent = monthlyAttendanceRecords.filter(record => record.status === 'PRESENT').length;
    const monthlyAbsent = monthlyAttendanceRecords.filter(record => record.status === 'ABSENT').length;
    const monthlyLate = monthlyAttendanceRecords.filter(record => record.status === 'LATE').length;
    const monthlyTotal = monthlyAttendanceRecords.length;
    const monthlyPercentage = monthlyTotal > 0 ? Math.round((monthlyPresent / monthlyTotal) * 100) : 0;
    
    return NextResponse.json({
      subjects,
      todayAttendance,
      monthlyStats: {
        present: monthlyPresent,
        absent: monthlyAbsent,
        late: monthlyLate,
        total: monthlyTotal,
        percentage: monthlyPercentage,
        month: today.toLocaleString('default', { month: 'long' })
      }
    });
  } catch (error: any) {
    console.error('Get student attendance error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch attendance data', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
