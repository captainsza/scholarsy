import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
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
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    
    const studentId = params.studentId;
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Fetch attendance records
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        course: true,
      },
      orderBy: {
        date: 'desc',
      },
    });

    // Also fetch subject-specific attendance records
    const subjectAttendanceRecords = await prisma.subjectAttendance.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        subject: {
          include: {
            course: true,
            faculty: {
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
      orderBy: {
        date: 'desc',
      },
    });

    // Transform data for the frontend
    const transformedRecords = [
      // Transform course attendance records
      ...attendanceRecords.map(record => ({
        id: record.id,
        date: record.date.toISOString(),
        status: record.status,
        courseName: record.course.name,
        courseCode: record.course.name.substring(0, 4).toUpperCase(),
      })),
      
      // Transform subject attendance records
      ...subjectAttendanceRecords.map(record => ({
        id: record.id,
        date: record.date.toISOString(),
        status: record.status,
        courseName: record.subject.course.name,
        courseCode: record.subject.course.name.substring(0, 4).toUpperCase(),
        subjectName: record.subject.name,
        subjectCode: record.subject.code,
        faculty: record.subject.faculty ? {
          name: `${record.subject.faculty.user.profile?.firstName || ''} ${record.subject.faculty.user.profile?.lastName || ''}`.trim(),
        } : undefined,
      })),
    ];

    // Calculate attendance summary
    const totalRecords = transformedRecords.length;
    const presentRecords = transformedRecords.filter(r => r.status === 'PRESENT').length;
    const absentRecords = transformedRecords.filter(r => r.status === 'ABSENT').length;
    const lateRecords = transformedRecords.filter(r => r.status === 'LATE').length;
    
    // Group by course for course-wise summary
    const courseWiseSummary: Record<string, {
      courseName: string;
      total: number;
      present: number;
      absent: number;
      late: number;
      percentage: number;
    }> = {};
    
    // Populate course-wise summary
    transformedRecords.forEach(record => {
      if (!courseWiseSummary[record.courseCode]) {
        courseWiseSummary[record.courseCode] = {
          courseName: record.courseName,
          total: 0,
          present: 0,
          absent: 0,
          late: 0,
          percentage: 0,
        };
      }
      
      courseWiseSummary[record.courseCode].total++;
      if (record.status === 'PRESENT') {
        courseWiseSummary[record.courseCode].present++;
      } else if (record.status === 'ABSENT') {
        courseWiseSummary[record.courseCode].absent++;
      } else if (record.status === 'LATE') {
        courseWiseSummary[record.courseCode].late++;
      }
    });
    
    // Calculate percentages for course-wise summary
    Object.keys(courseWiseSummary).forEach(courseCode => {
      const summary = courseWiseSummary[courseCode];
      summary.percentage = (summary.present / summary.total) * 100;
    });

    return NextResponse.json({
      attendanceRecords: transformedRecords,
      summary: {
        total: totalRecords,
        present: presentRecords,
        absent: absentRecords,
        late: lateRecords,
        percentage: totalRecords > 0 ? (presentRecords / totalRecords) * 100 : 0,
        courseWise: courseWiseSummary,
      },
    });
  } catch (error: any) {
    console.error('Student attendance fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student attendance', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
