import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const studentId = searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ message: 'Student ID is required' }, { status: 400 });
    }

    // Get all courses the student is enrolled in
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        studentId,
        status: "ACTIVE"
      },
      include: {
        course: {
          include: {
            faculty: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            },
            schedules: {
              include: {
                room: true
              }
            }
          }
        }
      }
    });

    // Transform the data for the response
    const courses = enrollments.map(enrollment => {
      const course = enrollment.course;
      
      // Calculate class hours per week
      const totalMinutesPerWeek = course.schedules.reduce((total, schedule) => {
        const startParts = schedule.startTime.split(':').map(Number);
        const endParts = schedule.endTime.split(':').map(Number);
        
        const startMinutes = startParts[0] * 60 + startParts[1];
        const endMinutes = endParts[0] * 60 + endParts[1];
        
        return total + (endMinutes - startMinutes);
      }, 0);
      
      const hoursPerWeek = Math.round(totalMinutesPerWeek / 60 * 10) / 10;
      
      // Get the teacher name
      const teacherName = course.faculty?.user?.profile 
        ? `${course.faculty.user.profile.firstName} ${course.faculty.user.profile.lastName}`
        : "Unassigned";
      
      return {
        id: course.id,
        name: course.name,
        branch: course.branch || "", // Use branch instead of code
        description: course.description || "",
        semester: course.semester,
        academicTerm: `${course.year} - ${course.semester}`, // Create an academicTerm field
        enrollmentId: enrollment.id,
        enrollmentStatus: enrollment.status,
        enrollmentDate: enrollment.enrolledAt,
        teacher: teacherName,
        hoursPerWeek: hoursPerWeek,
        credits: course.credits || 0,
        schedule: course.schedules.map(schedule => ({
          id: schedule.id,
          day: schedule.dayOfWeek,
          startTime: schedule.startTime,
          endTime: schedule.endTime,
          room: schedule.room?.name || "TBD"
        }))
      };
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error('Failed to fetch student courses:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student courses' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
