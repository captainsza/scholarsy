import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: { subjectId: string } }
) {
  try {
    // Properly await the params to fix the warning
    const { subjectId } = await Promise.resolve(context.params);
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json(
        { message: 'Faculty ID is required' },
        { status: 400 }
      );
    }
    
    console.log(`Processing request for subject: ${subjectId}, faculty: ${facultyId}`);
    
    // Verify that the faculty has access to this subject
    const facultyAccess = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        OR: [
          { facultyId },
          { 
            course: {
              facultyId
            }
          }
        ]
      }
    });
    
    if (!facultyAccess) {
      return NextResponse.json(
        { message: 'Access denied or subject not found' },
        { status: 403 }
      );
    }
    
    // Get subject with related data
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
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
        course: {
          include: {
            enrollments: {
              where: {
                status: "ACTIVE"
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
            },
            schedules: {
              include: {
                room: true
              }
            }
          }
        },
        attendances: true,
        assessments: true,
        classSchedules: {
          include: {
            room: true
          }
        }
      }
    });
    
    if (!subject) {
      return NextResponse.json({ message: 'Subject not found' }, { status: 404 });
    }
    
    // Safely handle potential missing data with checks and defaults
    const courseEnrollments = subject.course?.enrollments || [];
    
    // Transform for API response - with safe handling of undefined values
    const subjectData = {
      id: subject.id,
      name: subject.name || 'Unnamed Subject',
      code: subject.code || 'No Code',
      description: subject.description,
      creditHours: subject.creditHours,
      courseId: subject.courseId,
      courseName: subject.course?.name || 'Unknown Course',
      
      faculty: subject.faculty ? {
        id: subject.faculty.id,
        name: subject.faculty.user.profile ? 
              `${subject.faculty.user.profile.firstName} ${subject.faculty.user.profile.lastName}` :
              'Unknown Faculty',
        department: subject.faculty.department || 'Unknown Department'
      } : null,
      
      course: subject.course ? {
        id: subject.course.id,
        name: subject.course.name || 'Unknown Course',
        branch: subject.course.branch || 'N/A',
        year: subject.course.year || 'N/A',
        semester: subject.course.semester || 'N/A',
        studentCount: courseEnrollments.length
      } : { 
        id: '', 
        name: 'Unknown Course',
        branch: 'N/A',
        year: 'N/A',
        semester: 'N/A',
        studentCount: 0 
      },
      
      // Format student data with careful null handling
      students: courseEnrollments.map(enrollment => ({
        id: enrollment.student?.id || '',
        name: enrollment.student?.user?.profile ?
              `${enrollment.student.user.profile.firstName} ${enrollment.student.user.profile.lastName}` :
              'Unknown Student',
        enrollmentId: enrollment.student?.enrollmentId || 'N/A',
        profileImage: enrollment.student?.user?.profile?.profileImage || null
      })),
      
      // Combine schedules from both direct class schedules and course schedules
      schedules: [
        ...(subject.classSchedules || []).map(schedule => ({
          id: schedule.id,
          day: schedule.dayOfWeek || '',
          startTime: schedule.startTime || '',
          endTime: schedule.endTime || '',
          room: schedule.room?.name || 'Not assigned',
          type: 'subject-specific'
        })),
        ...(subject.course?.schedules || [])
          .filter(schedule => schedule.subjectId === subject.id)
          .map(schedule => ({
            id: schedule.id,
            day: schedule.dayOfWeek || '',
            startTime: schedule.startTime || '',
            endTime: schedule.endTime || '',
            room: schedule.room?.name || 'Not assigned',
            type: 'course-schedule'
          }))
      ],
      
      attendanceCount: (subject.attendances || []).length,
      assessmentCount: (subject.assessments || []).length
    };

    return NextResponse.json({ subject: subjectData });
  } catch (error: any) {
    console.error('Failed to fetch subject details:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subject details', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update subject details
export async function PUT(
  req: NextRequest,
  context: { params: { subjectId: string } }
) {
  try {
    const { subjectId } = context.params;
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    const data = await req.json();
    
    if (!facultyId) {
      return NextResponse.json({ message: "Faculty ID is required" }, { status: 400 });
    }

    // Verify faculty is associated with this subject
    const hasAccess = await prisma.subject.count({
      where: {
        id: subjectId,
        facultyId
      }
    });

    if (hasAccess === 0) {
      return NextResponse.json({ message: "You don't have permission to update this subject" }, { status: 403 });
    }

    // Update subject
    const updatedSubject = await prisma.subject.update({
      where: { id: subjectId },
      data: {
        name: data.name,
        code: data.code,
        description: data.description,
        creditHours: data.creditHours
      }
    });

    return NextResponse.json({ 
      message: "Subject updated successfully",
      subject: updatedSubject
    });
  } catch (error) {
    console.error("Failed to update subject:", error);
    return NextResponse.json(
      { message: "Failed to update subject" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Make sure CORS headers are properly set
export const dynamic = 'force-dynamic';
export const revalidate = 0;
