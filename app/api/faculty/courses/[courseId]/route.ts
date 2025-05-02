import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { getSessionUser } from '@/lib/session-utils';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Get the current user from session
    let user;
    
    try {
      user = await getSessionUser(req);
    } catch (error) {
      console.error('Session fetch failed:', error);
      const token = req.cookies.get('auth-token')?.value;
      
      if (!token) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
      }
      
      // Verify and decode the token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key'
      ) as { id: string, role: string };
      
      // Get user from DB
      user = await prisma.user.findUnique({
        where: { id: decoded.id },
      });
      
      if (!user) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
      }
    }
    
    // Verify user is a faculty member
    if (user.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }
    
    // Get faculty record
    const faculty = await prisma.faculty.findFirst({
      where: { userId: user.id },
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }
    
    const courseId = params.courseId;
    
    // Get course details
    const course = await prisma.course.findUnique({
      where: { id: courseId },
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
    });
    
    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 });
    }
    
    // Get subjects assigned to the current faculty in this course
    const subjects = await prisma.subject.findMany({
      where: { 
        courseId: courseId,
        facultyId: faculty.id
      }
    });
    
    // Get student enrollments in this course
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { 
        courseId: courseId,
        status: 'ACTIVE'
      },
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
    });
    
    // Get schedules for the course where the faculty is teaching
    const schedules = await prisma.classSchedule.findMany({
      where: {
        courseId: courseId,
        OR: [
          // Schedules for subjects taught by this faculty
          {
            subject: {
              facultyId: faculty.id
            }
          },
          // Schedules for this course if faculty is the coordinator
          {
            course: {
              facultyId: faculty.id
            }
          }
        ]
      },
      include: {
        subject: true,
        room: true
      }
    });
    
    // Format student data
    const students = enrollments.map(enrollment => ({
      id: enrollment.student.id,
      name: enrollment.student.user.profile 
        ? `${enrollment.student.user.profile.firstName} ${enrollment.student.user.profile.lastName}` 
        : 'Unknown',
      enrollmentId: enrollment.student.enrollmentId,
      profileImage: enrollment.student.user.profile?.profileImage || null,
      enrollmentStatus: enrollment.status,
      enrolledAt: enrollment.enrolledAt
    }));
    
    // Format schedule data
    const formattedSchedules = schedules.map(schedule => ({
      id: schedule.id,
      day: schedule.dayOfWeek,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      room: schedule.room?.name || 'Not assigned',
      subjectName: schedule.subject?.name || 'General Session',
      subjectCode: schedule.subject?.code || ''
    }));
    
    // Format course data
    const courseDetails = {
      id: course.id,
      name: course.name,
      description: course.description || '',
      branch: course.branch,
      year: course.year,
      semester: course.semester,
      credits: course.credits || 0,
      coordinatorName: course.faculty?.user?.profile 
        ? `${course.faculty.user.profile.firstName} ${course.faculty.user.profile.lastName}` 
        : 'Not assigned',
      isCoordinator: course.facultyId === faculty.id,
      subjects: subjects.map(subject => ({
        id: subject.id,
        name: subject.name,
        code: subject.code,
        creditHours: subject.creditHours,
        description: subject.description || ''
      })),
      students,
      schedules: formattedSchedules,
      studentCount: students.length,
      subjectCount: subjects.length
    };
    
    return NextResponse.json({ course: courseDetails });
  } catch (error: any) {
    console.error('Faculty course detail fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch course details', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
