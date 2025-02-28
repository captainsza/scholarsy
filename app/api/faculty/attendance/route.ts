import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

// GET: Fetch attendance data for a specific course and date
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

    // Get URL parameters
    const courseId = req.nextUrl.searchParams.get('courseId');
    const dateStr = req.nextUrl.searchParams.get('date');
    
    if (!courseId || !dateStr) {
      return NextResponse.json({ message: 'courseId and date are required' }, { status: 400 });
    }

    // Parse the date
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    // Verify that the faculty teaches this course
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!courseExists) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }

    // Get all students registered for the course
    const registrations = await prisma.registration.findMany({
      where: { courseId },
      include: {
        student: {
          include: {
            user: {
              include: {
                profile: true,
              }
            }
          }
        }
      }
    });

    // Get existing attendance records for that date and course
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        courseId,
        date: {
          gte: date,
          lt: nextDay,
        }
      }
    });

    // Map students with their attendance status
    const students = registrations.map(reg => {
      const student = reg.student;
      const attendanceRecord = attendanceRecords.find(ar => ar.studentId === student.id);
      
      return {
        id: student.id,
        name: student.user.profile ? 
              `${student.user.profile.firstName} ${student.user.profile.lastName}` : 
              'Unknown',
        enrollmentId: student.enrollmentId,
        attendanceStatus: attendanceRecord?.status || null,
        attendanceId: attendanceRecord?.id || null,
      };
    });

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error('Get attendance error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch attendance data' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Save or update attendance records
export async function POST(req: NextRequest) {
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

    // Parse request body
    const { courseId, date, attendanceData } = await req.json();
    
    if (!courseId || !date || !attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // Parse the date
    const attendanceDate = new Date(date);

    // Process each attendance record
    const attendance = [];
    
    for (const record of attendanceData) {
      const { studentId, status, attendanceId } = record;
      
      // Update existing record or create new one
      if (attendanceId) {
        // Update existing record
        const updated = await prisma.attendance.update({
          where: { id: attendanceId },
          data: { status },
        });
        attendance.push(updated);
      } else {
        // Create new record
        const created = await prisma.attendance.create({
          data: {
            studentId,
            courseId,
            date: attendanceDate,
            status,
          },
        });
        attendance.push(created);
      }
    }

    return NextResponse.json({ 
      message: 'Attendance saved successfully',
      attendance,
    });
  } catch (error: any) {
    console.error('Save attendance error:', error);
    return NextResponse.json(
      { message: 'Failed to save attendance data' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
