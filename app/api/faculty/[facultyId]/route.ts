import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  try {
    const facultyId = params.facultyId;
    
    // Find the faculty member with all related data
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            emailVerified: true,
            isApproved: true,
            profile: true,
          },
        },
        subjects: {
          include: {
            course: {
              include: {
                enrollments: {
                  where: {
                    status: 'ACTIVE',
                  },
                },
              },
            },
          },
        },
        courses: {
          include: {
            subjects: true,
            enrollments: {
              where: {
                status: 'ACTIVE',
              },
            },
          },
        },
        schedules: {
          include: {
            room: true,
          },
        },
      },
    });
    
    if (!faculty) {
      return NextResponse.json(
        { message: "Faculty not found" },
        { status: 404 }
      );
    }
    
    // Calculate additional statistics
    
    // Get subjects taught by this faculty
    const subjectIds = faculty.subjects.map(subject => subject.id);
    
    // Get total students count (unique across all subjects)
    const totalStudents = new Set();
    faculty.subjects.forEach(subject => {
      if (subject.course?.enrollments) {
        subject.course.enrollments.forEach(enrollment => {
          totalStudents.add(enrollment.studentId);
        });
      }
    });
    
    // Calculate total teaching hours
    const totalHours = faculty.schedules.reduce((total, schedule) => {
      const startDate = new Date(schedule.startTime);
      const startHour = startDate.getHours();
      const startMinutes = startDate.getMinutes();
      
      const endDate = new Date(schedule.endTime);
      const endHour = endDate.getHours();
      const endMinutes = endDate.getMinutes();
      
      const hours = endHour - startHour + (endMinutes - startMinutes) / 60;
      return total + hours;
    }, 0);
    
    // Process subjects to add student count
    const processedSubjects = faculty.subjects.map(subject => ({
      ...subject,
      studentsCount: subject.course?.enrollments?.length || 0
    }));
    
    // Get attendance statistics by subject
    const attendanceSummary: Record<string, { present: number, absent: number, late: number }> = {};
    
    for (const subject of faculty.subjects) {
      const attendanceCounts = await prisma.subjectAttendance.groupBy({
        by: ['status'],
        where: {
          subjectId: subject.id,
        },
        _count: {
          status: true,
        },
      });

      const present = attendanceCounts.find(c => c.status === 'PRESENT')?._count?.status || 0;
      const absent = attendanceCounts.find(c => c.status === 'ABSENT')?._count?.status || 0;
      const late = attendanceCounts.find(c => c.status === 'LATE')?._count?.status || 0;
      
      attendanceSummary[`${subject.code}: ${subject.name}`] = { present, absent, late };
    }
    
    // Get upcoming classes (next 5 days)
    const today = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDay = today.getDay();
    const currentHour = today.getHours();
    const currentMinute = today.getMinutes();
    
    const upcomingClasses = faculty.schedules
      .map(schedule => {
        // Convert schedule day string to day index
        const scheduleDayIndex = dayNames.indexOf(schedule.dayOfWeek);
        if (scheduleDayIndex === -1) return null;
        
        // Calculate days until this class occurs
        let daysUntil = scheduleDayIndex - currentDay;
        if (daysUntil < 0) daysUntil += 7; // Wrap to next week
        
        // If it's today, check if the class is still upcoming
        if (daysUntil === 0) {
          const scheduleDate = new Date(schedule.startTime);
          const scheduleHour = scheduleDate.getHours();
          const scheduleMinute = scheduleDate.getMinutes();
          if (scheduleHour < currentHour || 
             (scheduleHour === currentHour && scheduleMinute <= currentMinute)) {
            daysUntil = 7; // Move to next week if class has already started/passed
          }
        }
        
        return {
          ...schedule,
          daysUntil,
          roomName: schedule.room?.name || "TBD",
        };
      })
      .filter(schedule => schedule !== null && schedule.daysUntil <= 5)
      .sort((a, b) => a!.daysUntil - b!.daysUntil);
    
    // Compile additional data for the response
    const enhancedFaculty = {
      ...faculty,
      subjects: processedSubjects,
      totalStudents: totalStudents.size,
      totalHours: parseFloat(totalHours.toFixed(1)),
      attendanceSummary,
      upcomingClasses,
      coordinatedCourses: faculty.courses,
    };
    
    return NextResponse.json({
      faculty: enhancedFaculty
    });
  } catch (error) {
    console.error("Failed to fetch faculty:", error);
    return NextResponse.json(
      { message: "Failed to fetch faculty details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
