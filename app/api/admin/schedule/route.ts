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
    
    // Fetch class schedules with related data, including subjects
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
            subjects: true,
          },
        },
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
      // Get faculty name based on the assigned faculty to the schedule or subject
      let facultyName = "Unassigned";
      if (schedule.subject?.faculty?.user?.profile) {
        facultyName = `${schedule.subject.faculty.user.profile.firstName} ${schedule.subject.faculty.user.profile.lastName}`;
      } else if (schedule.course?.faculty?.user?.profile) {
        facultyName = `${schedule.course.faculty.user.profile.firstName} ${schedule.course.faculty.user.profile.lastName}`;
      }
      
      return {
        id: schedule.id,
        courseId: schedule.courseId,
        courseName: schedule.course.name,
        subjectId: schedule.subjectId,
        subjectName: schedule.subject ? schedule.subject.name : "General",
        subjectCode: schedule.subject ? schedule.subject.code : "",
        roomName: schedule.room?.name || 'Unassigned',
        roomId: schedule.roomId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        facultyName,
        facultyId: schedule.subject?.facultyId || schedule.course?.facultyId || null,
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
      subjectId,
      facultyId,
      dayOfWeek, 
      startTime, 
      endTime, 
      roomId 
    } = await req.json();
    
    // Validate required fields - make roomId optional
    if (!courseId || !subjectId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { message: 'Required fields missing: course, subject, day and time are required' }, 
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
    
    // Validate the subject exists and belongs to the course
    const subjectExists = await prisma.subject.findFirst({
      where: { 
        id: subjectId,
        courseId: courseId
      },
    });
    
    if (!subjectExists) {
      return NextResponse.json(
        { message: 'Subject not found or does not belong to the selected course' }, 
        { status: 404 }
      );
    }
    
    // If roomId is provided, validate the room exists
    if (roomId && roomId !== "none") {
      const roomExists = await prisma.room.findUnique({
        where: { id: roomId },
      });
      
      if (!roomExists) {
        return NextResponse.json(
          { message: 'Room not found' }, 
          { status: 404 }
        );
      }
      
      // Check for room booking conflicts only if a room is selected
      const roomConflict = await prisma.classSchedule.findFirst({
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
            // Schedule encompasses an existing schedule
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      });
      
      if (roomConflict) {
        return NextResponse.json(
          { message: 'Room is already booked during this time slot' }, 
          { status: 409 }
        );
      }
    }
    
    // Check for faculty conflicts
    if (facultyId) {
      const facultyConflict = await prisma.classSchedule.findFirst({
        where: {
          dayOfWeek,
          subject: {
            facultyId
          },
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
            // Schedule encompasses an existing schedule
            {
              startTime: { gte: startTime },
              endTime: { lte: endTime },
            },
          ],
        },
      });
      
      if (facultyConflict) {
        return NextResponse.json(
          { message: 'Faculty is already scheduled during this time slot' }, 
          { status: 409 }
        );
      }
    }
    
    // Create the schedule with an optional roomId
    const newSchedule = await prisma.classSchedule.create({
      data: {
        courseId,
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        // Only include roomId if it's provided and not "none"
        ...(roomId && roomId !== "none" ? { roomId } : {})
      },
      include: {
        course: true,
        subject: true,
        room: true,
      },
    });
    
    // If faculty was provided and different from current subject faculty, update the subject
    if (facultyId && subjectExists.facultyId !== facultyId) {
      await prisma.subject.update({
        where: { id: subjectId },
        data: { facultyId }
      });
    }
    
    return NextResponse.json({ schedule: newSchedule }, { status: 201 });
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
