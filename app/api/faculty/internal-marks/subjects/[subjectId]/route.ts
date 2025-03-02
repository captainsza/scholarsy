import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get details of a specific subject for a faculty member
export async function GET(
  req: NextRequest,
  context: { params: { subjectId: string } }
) {
  try {
    const { subjectId } = context.params;
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    // First find the subject without checking faculty access
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
        section: {
          include: {
            course: true,
            enrollments: {
              where: { status: 'ACTIVE' },
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
        }
      }
    });

    if (!subject) {
      return NextResponse.json({ message: "Subject not found" }, { status: 404 });
    }

    // If facultyId is provided, verify access
    if (facultyId) {
      const hasAccess = subject.facultyId === facultyId || 
                        subject.section.course.facultyId === facultyId;
      
      if (!hasAccess) {
        return NextResponse.json({ message: "You don't have access to this subject" }, { status: 403 });
      }
    }

    // Get past attendance records for this subject
    const attendanceRecords = await prisma.subjectAttendance.findMany({
      where: { 
        subjectId 
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
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Get assessments for this subject
    const assessments = await prisma.assessment.findMany({
      where: {
        subjectId
      },
      include: {
        marks: {
          include: {
            student: {
              select: {
                id: true,
                enrollmentId: true,
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

    // Return subject with attendance statistics
    return NextResponse.json({ 
      subject,
      attendanceStats: {
        totalClasses: [...new Set(attendanceRecords.map(record => record.date.toDateString()))].length,
        totalRecords: attendanceRecords.length,
        records: attendanceRecords
      },
      assessments
    });
  } catch (error) {
    console.error("Failed to fetch subject details:", error);
    return NextResponse.json(
      { message: "Failed to fetch subject details" },
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
