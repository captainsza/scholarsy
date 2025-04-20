import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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
    
    // Admin can view all schedules, while students and faculty can only view their own
    if (!['ADMIN', 'FACULTY', 'STUDENT'].includes(decoded.role)) {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }
    
    // Get query parameters
    const courseId = req.nextUrl.searchParams.get('courseId');
    const dayOfWeek = req.nextUrl.searchParams.get('dayOfWeek');
    const roomId = req.nextUrl.searchParams.get('roomId');
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    // Build query conditions
    const where: any = {};
    
    if (courseId) {
      where.courseId = courseId;
    }
    
    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek;
    }
    
    if (roomId) {
      where.roomId = roomId;
    }
    
    // If the user is a faculty member, filter by their ID
    if (decoded.role === 'FACULTY' && !facultyId) {
      const faculty = await prisma.faculty.findFirst({
        where: { userId: decoded.id },
      });
      
      if (faculty) {
        // Find courses assigned to this faculty
        const facultyCourses = await prisma.course.findMany({
          where: { facultyId: faculty.id },
          select: { id: true },
        });
        
        // Find subjects assigned to this faculty
        const facultySubjects = await prisma.subject.findMany({
          where: { facultyId: faculty.id },
          select: { courseId: true },
        });
        
        // Combine all course IDs this faculty is associated with
        const courseIds = [
          ...facultyCourses.map(c => c.id),
          ...facultySubjects.map(s => s.courseId)
        ];
        
        if (courseIds.length > 0) {
          where.courseId = { in: courseIds };
        } else {
          // If faculty has no courses, return empty array
          return NextResponse.json({ schedules: [] });
        }
      }
    }
    
    // If the user is a student, filter schedules related to their courses
    if (decoded.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: decoded.id },
      });
      
      if (student) {
        // Find courses this student is enrolled in
        const enrollments = await prisma.courseEnrollment.findMany({
          where: { 
            studentId: student.id,
            status: 'ACTIVE'
          },
          select: { courseId: true },
        });
        
        const courseIds = enrollments.map(e => e.courseId);
        
        if (courseIds.length > 0) {
          where.courseId = { in: courseIds };
        } else {
          // If student has no courses, return empty array
          return NextResponse.json({ schedules: [] });
        }
      }
    }
    
    // Fetch class schedules with related data
    const classSchedules = await prisma.classSchedule.findMany({
      where,
      include: {
        course: {
          include: {
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
        room: true,
      },
      orderBy: [
        // Order by day of week with custom ordering
        {
          dayOfWeek: 'asc',
        },
        // Then by start time
        {
          startTime: 'asc',
        },
      ],
    });
    
    // Transform data for the frontend
    const transformedSchedules = classSchedules.map(schedule => {
      // Get faculty name if available
      const facultyName = schedule.course.faculty?.user.profile
        ? `${schedule.course.faculty.user.profile.firstName} ${schedule.course.faculty.user.profile.lastName}`
        : 'Unassigned';
      
      return {
        id: schedule.id,
        courseId: schedule.courseId,
        courseName: schedule.course.name,
        roomName: schedule.room?.name || 'Unassigned',
        roomId: schedule.roomId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        facultyName,
        facultyId: schedule.course.faculty?.id || null,
      };
    });
    
    return NextResponse.json({ schedules: transformedSchedules });
  } catch (error: any) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch schedules' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

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
    
    // Only admins can create schedules
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    
    const { 
      courseId, 
      dayOfWeek, 
      startTime, 
      endTime, 
      roomId 
    } = await req.json();
    
    // Validate required fields
    if (!courseId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { message: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Validate the course exists
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId },
    });
    
    if (!courseExists) {
      return NextResponse.json(
        { message: 'Course not found' }, 
        { status: 404 }
      );
    }
    
    // If roomId is provided, validate the room exists
    if (roomId) {
      const roomExists = await prisma.room.findUnique({
        where: { id: roomId },
      });
      
      if (!roomExists) {
        return NextResponse.json(
          { message: 'Room not found' }, 
          { status: 404 }
        );
      }
    }
    
    // Check for scheduling conflicts (room double-booking)
    if (roomId) {
      const conflictingSchedule = await prisma.classSchedule.findFirst({
        where: {
          dayOfWeek,
          roomId,
          OR: [
            // Schedule starts during an existing schedule
            {
              startTime: { lte: startTime },
              endTime: { gt: startTime },
            },
            // Schedule ends during an existing schedule
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
            // Schedule spans an existing schedule
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      });
      
      if (conflictingSchedule) {
        return NextResponse.json(
          { message: 'Room is already booked during this time slot' }, 
          { status: 409 }
        );
      }
    }
    
    // Create the new schedule
    const newSchedule = await prisma.classSchedule.create({
      data: {
        courseId,
        dayOfWeek,
        startTime,
        endTime,
        roomId,
      },
      include: {
        course: true,
        room: true,
      },
    });
    
    return NextResponse.json(newSchedule, { status: 201 });
  } catch (error: any) {
    console.error('Schedule creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create schedule' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
