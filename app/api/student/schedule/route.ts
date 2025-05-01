import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
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

    // Get the student record
    const student = await prisma.student.findFirst({
      where: { userId: decoded.id },
      include: {
        courseEnrollments: {
          where: { status: 'ACTIVE' },
          include: { course: true }
        }
      }
    });
    
    if (!student) {
      return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
    }

    // Get course IDs the student is enrolled in
    const enrolledCourseIds = student.courseEnrollments.map(enrollment => enrollment.courseId);
    
    if (enrolledCourseIds.length === 0) {
      return NextResponse.json({ schedules: [] });
    }

    // Get schedules for enrolled courses
    const schedules = await prisma.classSchedule.findMany({
      where: {
        courseId: { in: enrolledCourseIds }
      },
      include: {
        course: true,
        room: true,
        subject: {
          include: {
            faculty: {
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
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Transform data for frontend
    const transformedSchedules = schedules.map(schedule => {
      // Get faculty name
      const facultyName = schedule.subject?.faculty?.user?.profile
        ? `${schedule.subject.faculty.user.profile.firstName} ${schedule.subject.faculty.user.profile.lastName}`
        : 'Not Assigned';

      return {
        id: schedule.id,
        courseId: schedule.courseId,
        courseName: schedule.course.name,
        subjectName: schedule.subject?.name || 'General',
        subjectCode: schedule.subject?.code || '',
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        roomName: schedule.room?.name || 'Virtual/TBD',
        facultyName
      };
    });

    return NextResponse.json({ schedules: transformedSchedules });
  } catch (error: any) {
    console.error('Student schedule fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch schedules', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
