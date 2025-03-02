import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all sections for a course
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId;
    
    const sections = await prisma.courseSection.findMany({
      where: { courseId },
      include: {
        course: true,
        _count: {
          select: { 
            subjects: true,
            enrollments: true 
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Failed to fetch sections:", error);
    return NextResponse.json(
      { message: "Failed to fetch sections" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new section for a course
export async function POST(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId;
    const { name, academicTerm, capacity } = await req.json();

    // Validate required fields
    if (!name || !academicTerm || !capacity) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId }
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    // Create the section
    const section = await prisma.courseSection.create({
      data: {
        name,
        academicTerm,
        capacity,
        courseId
      }
    });

    return NextResponse.json(
      { message: "Section created successfully", section },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create section:", error);
    return NextResponse.json(
      { message: "Failed to create section" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
