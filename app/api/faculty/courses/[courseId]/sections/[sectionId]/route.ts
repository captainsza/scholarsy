import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get details for a specific section taught by faculty
export async function GET(
  req: NextRequest,
  context: { params: { courseId: string, sectionId: string } }
) {
  try {
    const { courseId, sectionId } = context.params;
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json({ message: "Faculty ID is required" }, { status: 400 });
    }

    // Check if faculty has access to this section
    const hasAccess = await prisma.course.count({
      where: {
        id: courseId,
        facultyId,
        sections: {
          some: {
            id: sectionId
          }
        }
      }
    });

    // If not assigned to course directly, check if teaching subjects in this section
    if (hasAccess === 0) {
      const teachesSubjects = await prisma.subject.count({
        where: {
          facultyId,
          sectionId
        }
      });

      if (teachesSubjects === 0) {
        return NextResponse.json({ message: "Faculty does not have access to this section" }, { status: 403 });
      }
    }

    // Get the section with detailed information
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
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
        enrollments: {
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
    });

    if (!section) {
      return NextResponse.json({ message: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error("Failed to fetch section details:", error);
    return NextResponse.json(
      { message: "Failed to fetch section details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Record attendance for students in this section
export async function POST(
  req: NextRequest,
  context: { params: { courseId: string, sectionId: string } }
) {
  try {
    const { sectionId } = context.params;
    const { subjectId, attendanceRecords, facultyId } = await req.json();
    
    if (!facultyId) {
      return NextResponse.json({ message: "Faculty ID is required" }, { status: 400 });
    }

    // Verify faculty is assigned to this subject
    const subject = await prisma.subject.findUnique({
      where: {
        id: subjectId,
        sectionId,
        facultyId
      }
    });

    if (!subject) {
      return NextResponse.json({ message: "Faculty is not authorized for this subject" }, { status: 403 });
    }

    // Create attendance records
    const createdAttendance = await Promise.all(
      attendanceRecords.map((record: { studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' , remarks?: string }) =>
        prisma.subjectAttendance.create({
          data: {
            studentId: record.studentId,
            subjectId,
            date: new Date(),
            status: record.status,
            remarks: record.remarks
          }
        })
      )
    );

    return NextResponse.json({ 
      message: "Attendance recorded successfully",
      attendanceRecords: createdAttendance 
    });
  } catch (error) {
    console.error("Failed to record attendance:", error);
    return NextResponse.json(
      { message: "Failed to record attendance" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
