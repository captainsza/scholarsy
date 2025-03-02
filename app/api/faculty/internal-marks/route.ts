import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET internal marks for a specific course/subject and semester
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const subjectId = url.searchParams.get('subjectId');
    const courseId = url.searchParams.get('courseId');
    const semester = url.searchParams.get('semester');
    
    if ((!subjectId && !courseId) || !semester) {
      return NextResponse.json(
        { message: "Either Subject ID or Course ID is required, along with semester" },
        { status: 400 }
      );
    }

    let finalCourseId = courseId;

    // If subjectId is provided but not courseId, find the course through the subject
    if (subjectId && !courseId) {
      // Get the subject to find its course
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

      finalCourseId = subject.section.courseId;
    }

    // Now get all grade records for this course and semester
    const internalMarks = await prisma.gradeRecord.findMany({
      where: {
        courseId: finalCourseId || undefined,
        semester
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
        updatedAt: 'desc'
      }
    });

    return NextResponse.json({ internalMarks });
  } catch (error) {
    console.error("Failed to fetch internal marks:", error);
    return NextResponse.json(
      { message: "Failed to fetch internal marks" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
