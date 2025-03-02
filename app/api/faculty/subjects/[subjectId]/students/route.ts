import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get all students enrolled in a subject (via section)
export async function GET(req: NextRequest, { params }: { params: { subjectId: string } }) {
  try {
    const { subjectId } = params;

    // Get the subject first to find its section
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      select: { sectionId: true }
    });

    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found" },
        { status: 404 }
      );
    }

    // Get all enrollments for this section
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: {
        sectionId: subject.sectionId,
        status: "ACTIVE" // Only include active enrollments
      },
      select: {
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

    return NextResponse.json({ students });
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
