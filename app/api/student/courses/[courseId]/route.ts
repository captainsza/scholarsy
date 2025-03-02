import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get details for a specific student course - with async/await handling
export async function GET(
  req: NextRequest,
  context: { params: { courseId: string } }
) {
  try {
    console.log('GET request received for course details');
    // Fix: Access courseId only after awaiting context.params
    const { courseId } = context.params;
    const studentId = req.nextUrl.searchParams.get('studentId');
    
    console.log('Parameters:', { courseId, studentId });

    if (!studentId) {
      return NextResponse.json({ message: "Student ID is required" }, { status: 400 });
    }

    // Find the enrollment for this student in this course
    console.log('Finding enrollment...');
    const enrollment = await prisma.sectionEnrollment.findFirst({
      where: {
        studentId,
        section: {
          courseId
        }
      }
    });
    console.log('Enrollment found:', enrollment);

    if (!enrollment) {
      return NextResponse.json({ message: "Student is not enrolled in this course" }, { status: 404 });
    }

    // Get the course
    console.log('Fetching course details...');
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
        },
        sections: {
          include: {
            subjects: {
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
    console.log('Course found:', { courseId: course?.id, name: course?.name });

    if (!course) {
      return NextResponse.json({ message: "Course not found" }, { status: 404 });
    }

    // Get attendance records
    console.log('Fetching attendance records...');
    const attendance = await prisma.subjectAttendance.findMany({
      where: {
        studentId,
        subject: {
          section: {
            courseId
          }
        }
      },
      include: {
        subject: true
      },
      orderBy: {
        date: 'desc'
      }
    });
    console.log('Attendance records found:', attendance.length);

    // Get assignments
    console.log('Fetching assignments...');
    const assignments = await prisma.assessment.findMany({
      where: {
        subject: {
          section: {
            courseId
          }
        }
      },
      include: {
        marks: {
          where: {
            studentId
          }
        }
      }
    });
    console.log('Assignments found:', assignments.length);

    // Get section this student is enrolled in
    const studentSection = course.sections.find(section => 
      section.id === enrollment.sectionId
    );
    console.log('Student section:', studentSection?.name);

    // Format the response
    const courseDetails = {
      id: course.id,
      code: course.code,
      name: course.name,
      credits: course.credits,
      department: course.department,
      description: course.description,
      faculty: course.faculty ? {
        id: course.faculty.id,
        name: `${course.faculty.user.profile.firstName} ${course.faculty.user.profile.lastName}`,
        department: course.faculty.department
      } : null,
      section: studentSection ? {
        id: studentSection.id,
        name: studentSection.name,
        academicTerm: studentSection.academicTerm
      } : null,
      subjects: studentSection?.subjects.map(subject => ({
        id: subject.id,
        code: subject.code,
        name: subject.name,
        creditHours: subject.creditHours,
        description: subject.description,
        faculty: subject.faculty ? {
          id: subject.faculty.id,
          user: {
            profile: {
              firstName: subject.faculty.user.profile.firstName,
              lastName: subject.faculty.user.profile.lastName
            }
          }
        } : null
      })) || [],
      schedule: studentSection?.schedules.map(schedule => ({
        id: schedule.id,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        room: schedule.room ? {
          id: schedule.room.id,
          name: schedule.room.name,
          type: schedule.room.type
        } : null
      })) || [],
      attendance: attendance.map(record => ({
        id: record.id,
        date: record.date,
        status: record.status,
        remarks: record.remarks,
        subject: {
          id: record.subject.id,
          name: record.subject.name
        }
      })),
      assignments: assignments.map(assignment => ({
        id: assignment.id,
        title: assignment.title,
        type: assignment.type,
        maxMarks: assignment.maxMarks,
        weightage: assignment.weightage,
        dueDate: assignment.dueDate,
        submission: assignment.marks.length > 0 ? {
          submittedAt: assignment.marks[0].submittedAt,
          marksObtained: assignment.marks[0].marksObtained,
          feedback: assignment.marks[0].feedback
        } : null
      })),
      enrollment: {
        id: enrollment.id,
        status: enrollment.status,
        enrolledAt: enrollment.enrolledAt
      }
    };

    console.log('Sending response...');
    return NextResponse.json({ course: courseDetails });
  } catch (error) {
    console.error("Failed to fetch course details:", error);
    return NextResponse.json(
      { message: "Failed to fetch course details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
