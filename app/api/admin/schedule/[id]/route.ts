import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    // Get the schedule
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: params.id },
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
      }
    });
    
    if (!schedule) {
      return NextResponse.json({ message: 'Schedule not found' }, { status: 404 });
    }
    
    // If the user is a student or faculty, ensure they can only access their own schedules
    if (decoded.role === 'STUDENT') {
      const student = await prisma.student.findFirst({
        where: { userId: decoded.id },
      });
      
      if (student) {
        const enrollment = await prisma.courseEnrollment.findFirst({
          where: {
            studentId: student.id,
            courseId: schedule.courseId,
            status: 'ACTIVE'
          }
        });
        
        if (!enrollment) {
          return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }
      }
    } else if (decoded.role === 'FACULTY' && schedule.subject?.facultyId) {
      const faculty = await prisma.faculty.findFirst({
        where: { userId: decoded.id },
      });
      
      if (faculty && faculty.id !== schedule.subject.facultyId) {
        // Check if the faculty is teaching this course
        const courseCheck = await prisma.course.findFirst({
          where: {
            id: schedule.courseId,
            facultyId: faculty.id
          }
        });
        
        if (!courseCheck) {
          return NextResponse.json({ message: 'Access denied' }, { status: 403 });
        }
      }
    }
    
    // Get faculty name
    let facultyName = "Unassigned";
    if (schedule.subject?.faculty?.user?.profile) {
      facultyName = `${schedule.subject.faculty.user.profile.firstName} ${schedule.subject.faculty.user.profile.lastName}`;
    }
    
    // Transform the schedule for the frontend
    const transformedSchedule = {
      id: schedule.id,
      courseId: schedule.courseId,
      courseName: schedule.course.name,
      subjectId: schedule.subjectId,
      subjectName: schedule.subject ? schedule.subject.name : "General",
      subjectCode: schedule.subject ? schedule.subject.code : "",
      roomId: schedule.roomId,
      roomName: schedule.room?.name || 'Unassigned',
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      facultyId: schedule.subject?.facultyId || null,
      facultyName
    };
    
    return NextResponse.json({ schedule: transformedSchedule });
  } catch (error: any) {
    console.error('Schedule fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch schedule' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    // Only admins can update schedules
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
    
    // Validate required fields
    if (!courseId || !subjectId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { message: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Check if the schedule exists
    const existingSchedule = await prisma.classSchedule.findUnique({
      where: { id: params.id }
    });
    
    if (!existingSchedule) {
      return NextResponse.json(
        { message: 'Schedule not found' }, 
        { status: 404 }
      );
    }
    
    // Validate relationships
    // Course
    const courseExists = await prisma.course.findUnique({
      where: { id: courseId }
    });
    
    if (!courseExists) {
      return NextResponse.json(
        { message: 'Course not found' }, 
        { status: 404 }
      );
    }
    
    // Subject
    const subjectExists = await prisma.subject.findUnique({
      where: { 
        id: subjectId,
        courseId // Subject must belong to the specified course
      }
    });
    
    if (!subjectExists) {
      return NextResponse.json(
        { message: 'Subject not found or does not belong to the specified course' }, 
        { status: 404 }
      );
    }
    
    // Room (if provided)
    if (roomId) {
      const roomExists = await prisma.room.findUnique({
        where: { id: roomId }
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
          id: { not: params.id }, // Exclude the current schedule
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
    
    // Check for faculty conflicts
    if (facultyId) {
      const facultyConflict = await prisma.classSchedule.findFirst({
        where: {
          id: { not: params.id }, // Exclude the current schedule
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
            // Schedule spans an existing schedule
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
    
    // Update the schedule
    const updatedSchedule = await prisma.classSchedule.update({
      where: { id: params.id },
      data: {
        courseId,
        subjectId,
        dayOfWeek,
        startTime,
        endTime,
        roomId,
      },
      include: {
        course: true,
        room: true,
        subject: true
      }
    });
    
    // If a faculty is specified and not already assigned to the subject, update the subject
    if (facultyId && subjectExists.facultyId !== facultyId) {
      await prisma.subject.update({
        where: { id: subjectId },
        data: { facultyId }
      });
    }
    
    return NextResponse.json({ schedule: updatedSchedule });
  } catch (error: any) {
    console.error('Schedule update error:', error);
    return NextResponse.json(
      { message: 'Failed to update schedule' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
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
    
    // Only admins can delete schedules
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    
    // Check if the schedule exists
    const schedule = await prisma.classSchedule.findUnique({
      where: { id: params.id }
    });
    
    if (!schedule) {
      return NextResponse.json(
        { message: 'Schedule not found' }, 
        { status: 404 }
      );
    }
    
    // Delete the schedule
    await prisma.classSchedule.delete({
      where: { id: params.id }
    });
    
    return NextResponse.json({ message: 'Schedule deleted successfully' });
  } catch (error: any) {
    console.error('Schedule deletion error:', error);
    return NextResponse.json(
      { message: 'Failed to delete schedule' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
