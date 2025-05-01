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

    // Find all subjects taught by this faculty
    const subjects = await prisma.subject.findMany({
      where: { facultyId: faculty.id },
      select: { id: true }
    });
    
    const subjectIds = subjects.map(subject => subject.id);

    // Get schedules for subjects taught by this faculty
    const subjectSchedules = await prisma.classSchedule.findMany({
      where: {
        subjectId: { in: subjectIds.length > 0 ? subjectIds : ['none'] }
      },
      include: {
        course: true,
        room: true,
        subject: true
      }
    });

    // Get courses coordinated by this faculty
    const courseSchedules = await prisma.classSchedule.findMany({
      where: {
        course: {
          facultyId: faculty.id
        }
      },
      include: {
        course: true,
        room: true,
        subject: true
      }
    });

    // Combine both sets of schedules (remove duplicates)
    const combinedSchedules = [...subjectSchedules];
    courseSchedules.forEach(courseSchedule => {
      if (!combinedSchedules.some(s => s.id === courseSchedule.id)) {
        combinedSchedules.push(courseSchedule);
      }
    });

    // Sort schedules
    combinedSchedules.sort((a, b) => {
      // Order by day of week with custom ordering
      const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
      const dayDiff = days.indexOf(a.dayOfWeek) - days.indexOf(b.dayOfWeek);
      if (dayDiff !== 0) return dayDiff;
      
      // Then by start time
      return a.startTime.localeCompare(b.startTime);
    });

    // Transform data for frontend
    const transformedSchedules = combinedSchedules.map(schedule => ({
      id: schedule.id,
      courseId: schedule.courseId,
      courseName: schedule.course.name,
      subjectName: schedule.subject?.name || 'General',
      subjectCode: schedule.subject?.code || '',
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      roomName: schedule.room?.name || 'Virtual/TBD',
      class: `${schedule.course.year} - ${schedule.course.branch}`
    }));

    return NextResponse.json({ schedules: transformedSchedules });
  } catch (error: any) {
    console.error('Faculty schedule fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch schedules', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
