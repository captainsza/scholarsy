import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Enroll students to a section
export async function POST(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const sectionId = params.sectionId;
    const { studentIds } = await req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { message: "No students provided for enrollment" },
        { status: 400 }
      );
    }

    // Check if section exists and get capacity
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        _count: {
          select: { enrollments: true }
        }
      }
    });

    if (!section) {
      return NextResponse.json(
        { message: "Section not found" },
        { status: 404 }
      );
    }

    // Check if there's capacity for all the students
    const availableSpots = section.capacity - section._count.enrollments;
    if (studentIds.length > availableSpots) {
      return NextResponse.json(
        { message: `Cannot enroll ${studentIds.length} students. Only ${availableSpots} spots available.` },
        { status: 400 }
      );
    }

    // Check if any of these students are already enrolled
    const existingEnrollments = await prisma.sectionEnrollment.findMany({
      where: {
        sectionId,
        studentId: {
          in: studentIds
        }
      }
    });

    if (existingEnrollments.length > 0) {
      return NextResponse.json(
        { message: "One or more students are already enrolled in this section" },
        { status: 400 }
      );
    }

    // Create enrollments for each student
    const enrollments = await Promise.all(
      studentIds.map(async (studentId) => {
        return prisma.sectionEnrollment.create({
          data: {
            studentId,
            sectionId,
            status: "ACTIVE"
          }
        });
      })
    );

    return NextResponse.json(
      { message: `Successfully enrolled ${enrollments.length} students`, enrollments },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to enroll students:", error);
    return NextResponse.json(
      { message: "Failed to enroll students" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Get students enrolled in a section
export async function GET(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const sectionId = params.sectionId;
    
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: { sectionId },
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
        student: {
          enrollmentId: 'asc'
        }
      }
    });

    return NextResponse.json({ enrollments });
  } catch (error) {
    console.error("Failed to fetch enrollments:", error);
    return NextResponse.json(
      { message: "Failed to fetch enrollments" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
