import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get all enrollments for a student
export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;

    // Check if the student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    // Get all enrollments for the student
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        section: {
          include: {
            course: true,
            subjects: {
              select: {
                id: true,
                name: true,
                code: true,
              }
            },
          }
        },
      },
      orderBy: [
        { status: "asc" },     // ACTIVE enrollments first
        { enrolledAt: "desc" } // Recent enrollments first
      ],
    });

    return NextResponse.json({
      student,
      enrollments,
    });
  } catch (error) {
    console.error("Failed to fetch student enrollments:", error);
    return NextResponse.json(
      { message: "Failed to fetch student enrollments" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
