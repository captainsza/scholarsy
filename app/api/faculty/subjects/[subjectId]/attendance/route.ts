import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }

    const { subjectId } = params;
    const dateParam = req.nextUrl.searchParams.get('date');
    
    if (!dateParam) {
      return NextResponse.json({ message: 'Date parameter is required' }, { status: 400 });
    }

    // Parse the date
    const date = new Date(dateParam);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    // Verify that the subject belongs to this faculty
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
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
                        profile: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    }

    // Get faculty from token
    const faculty = await prisma.faculty.findFirst({
      where: { userId: decoded.id }
    });

    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }

    // Check if the subject is taught by this faculty
    if (subject.facultyId !== faculty.id && subject.course?.facultyId !== faculty.id) {
      return NextResponse.json(
        { message: 'You do not have permission to access attendance for this subject' }, 
        { status: 403 }
      );
    }

    // Check if subject has enrollments
    if (!subject.course?.enrollments || subject.course.enrollments.length === 0) {
      return NextResponse.json({ students: [] });
    }

    // Get existing attendance records for that date and subject
    const attendanceRecords = await prisma.subjectAttendance.findMany({
      where: {
        subjectId,
        date: {
          gte: date,
          lt: nextDay
        }
      }
    });

    // Prepare student data with attendance status
    const students = subject.course.enrollments.map(enrollment => {
      const student = enrollment.student;
      const attendanceRecord = attendanceRecords.find(ar => ar.studentId === student.id);
      
      return {
        id: student.id,
        name: student.user.profile 
          ? `${student.user.profile.firstName} ${student.user.profile.lastName}` 
          : 'Unknown',
        enrollmentId: student.enrollmentId,
        profileImage: student.user.profile?.profileImage || null,
        attendanceStatus: attendanceRecord?.status || null,
        attendanceId: attendanceRecord?.id || null
      };
    });

    // Sort students by name for consistency
    students.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error('Subject attendance fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch attendance data', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { subjectId: string } }
) {
  try {
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }

    const { subjectId } = params;
    const { date, attendance } = await req.json();
    
    if (!date || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json({ message: 'Invalid request data' }, { status: 400 });
    }

    // Verify that the subject belongs to this faculty
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: { course: true }
    });

    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    }

    // Get faculty from token
    const faculty = await prisma.faculty.findFirst({
      where: { userId: decoded.id }
    });

    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }

    // Check if the subject is taught by this faculty
    if (subject.facultyId !== faculty.id && subject.course?.facultyId !== faculty.id) {
      return NextResponse.json(
        { message: 'You do not have permission to mark attendance for this subject' }, 
        { status: 403 }
      );
    }

    // Parse the date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Process attendance records
    const results = await prisma.$transaction(async (tx) => {
      const records = [];
      
      for (const record of attendance) {
        const { studentId, status, attendanceId } = record;
        
        if (attendanceId) {
          // Update existing record
          const updated = await tx.subjectAttendance.update({
            where: { id: attendanceId },
            data: { status }
          });
          records.push(updated);
        } else {
          // Create new record
          const created = await tx.subjectAttendance.create({
            data: {
              studentId,
              subjectId,
              date: attendanceDate,
              status
            }
          });
          records.push(created);
        }
      }
      
      return records;
    });

    return NextResponse.json({ 
      message: 'Attendance saved successfully',
      recordCount: results.length 
    });
  } catch (error: any) {
    console.error('Save attendance error:', error);
    return NextResponse.json(
      { message: 'Failed to save attendance data', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
