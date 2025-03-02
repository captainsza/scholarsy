import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Enroll a student in a course section
export async function POST(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;
    const { sectionId } = await req.json();
    
    if (!sectionId) {
      return NextResponse.json(
        { message: "Section ID is required" },
        { status: 400 }
      );
    }
    
    // Check if student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });
    
    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }
    
    // Check if section exists
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        _count: {
          select: { enrollments: true },
        },
      },
    });
    
    if (!section) {
      return NextResponse.json(
        { message: "Course section not found" },
        { status: 404 }
      );
    }
    
    // Check if section has capacity
    if (section._count.enrollments >= section.capacity) {
      return NextResponse.json(
        { message: "Section is at full capacity" },
        { status: 400 }
      );
    }
    
    // Check if student is already enrolled in this section
    const existingEnrollment = await prisma.sectionEnrollment.findFirst({
      where: {
        studentId,
        sectionId,
      },
    });
    
    if (existingEnrollment) {
      return NextResponse.json(
        { message: "Student is already enrolled in this section" },
        { status: 400 }
      );
    }
    
    // Create the enrollment
    const enrollment = await prisma.sectionEnrollment.create({
      data: {
        studentId,
        sectionId,
        status: "ACTIVE",
      },
      include: {
        section: {
          include: {
            course: true,
          },
        },
        student: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });
    
    return NextResponse.json({
      message: "Student enrolled successfully",
      enrollment,
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to enroll student:", error);
    return NextResponse.json(
      { message: "Failed to enroll student" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
