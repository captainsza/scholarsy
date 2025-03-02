import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get all students enrolled in a specific subject
export async function GET(
  req: NextRequest,
  context: { params: { subjectId: string } }
) {
  try {
    const { subjectId } = context.params;
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    // Find the subject first to get its section and course
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        section: {
          include: {
            course: true
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found" },
        { status: 404 }
      );
    }

    // If facultyId is provided, verify access
    if (facultyId) {
      const hasAccess = subject.facultyId === facultyId || 
                        (subject.section.course && 
                         await prisma.course.findFirst({
                           where: { 
                             id: subject.section.courseId,
                             facultyId
                           }
                         }));
      
      if (!hasAccess) {
        return NextResponse.json(
          { message: "You don't have access to this subject" },
          { status: 403 }
        );
      }
    }

    // Get all enrollments for this section
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: {
        sectionId: subject.sectionId,
        status: "ACTIVE" // Only include active enrollments
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

    // Extract student data from enrollments
    const students = enrollments.map(enrollment => enrollment.student);

    return NextResponse.json({ 
      subject,
      students,
      totalStudents: students.length
    });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json(
      { message: "Failed to fetch students" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
