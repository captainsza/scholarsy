import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Create or update assessment mark for student
export async function POST(req: NextRequest) {
  try {
    const { assessmentId, studentId, marksObtained, feedback } = await req.json();
    
    // Validate required fields
    if (!assessmentId || !studentId || marksObtained === undefined) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if assessment exists and get max marks
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      );
    }

    // Validate marks are within range
    if (parseFloat(marksObtained) < 0 || parseFloat(marksObtained) > assessment.maxMarks) {
      return NextResponse.json(
        { message: `Marks must be between 0 and ${assessment.maxMarks}` },
        { status: 400 }
      );
    }

    // Check if mark record already exists
    const existingMark = await prisma.assessmentMark.findFirst({
      where: {
        assessmentId,
        studentId
      }
    });

    let mark;
    if (existingMark) {
      // Update existing mark
      mark = await prisma.assessmentMark.update({
        where: { id: existingMark.id },
        data: {
          marksObtained: parseFloat(marksObtained),
          feedback,
          evaluatedAt: new Date()
        }
      });
    } else {
      // Create new mark
      mark = await prisma.assessmentMark.create({
        data: {
          assessmentId,
          studentId,
          marksObtained: parseFloat(marksObtained),
          feedback,
          evaluatedAt: new Date()
        }
      });
    }

    return NextResponse.json({
      message: existingMark ? "Mark updated successfully" : "Mark created successfully",
      mark
    });
  } catch (error) {
    console.error("Failed to save grade:", error);
    return NextResponse.json(
      { message: "Failed to save grade" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
