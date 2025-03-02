import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: List assessments for a subject
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const subjectId = url.searchParams.get("subjectId");

    if (!subjectId) {
      return NextResponse.json(
        { message: "Subject ID is required" },
        { status: 400 }
      );
    }

    const assessments = await prisma.assessment.findMany({
      where: { subjectId },
      include: {
        _count: {
          select: { marks: true }
        }
      },
      orderBy: {
        id: 'desc' // or another valid field from your Assessment model
      }
    });

    return NextResponse.json({ assessments });
  } catch (error) {
    console.error("Failed to fetch assessments:", error);
    return NextResponse.json(
      { message: "Failed to fetch assessments" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create a new assessment
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { title, subjectId, type, maxMarks, weightage, dueDate, instructions } = data;

    // Validate required fields
    if (!title || !subjectId || !type || !maxMarks || weightage === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Create the assessment
    const assessment = await prisma.assessment.create({
      data: {
        title,
        subjectId,
        type,
        maxMarks,
        weightage,
        dueDate: dueDate ? new Date(dueDate) : null,
        instructions,
      }
    });

    return NextResponse.json(
      { message: "Assessment created successfully", assessment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create assessment:", error);
    return NextResponse.json(
      { message: "Failed to create assessment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Update an existing assessment
export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const { id, title, subjectId, type, maxMarks, weightage, dueDate, instructions } = data;

    // Validate required fields
    if (!id || !title || !subjectId || !type || !maxMarks || weightage === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if assessment exists
    const existingAssessment = await prisma.assessment.findUnique({
      where: { id }
    });

    if (!existingAssessment) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      );
    }

    // Update the assessment
    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        title,
        type,
        maxMarks,
        weightage,
        dueDate: dueDate ? new Date(dueDate) : null,
        instructions,
      }
    });

    return NextResponse.json({
      message: "Assessment updated successfully",
      assessment
    });
  } catch (error) {
    console.error("Failed to update assessment:", error);
    return NextResponse.json(
      { message: "Failed to update assessment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
