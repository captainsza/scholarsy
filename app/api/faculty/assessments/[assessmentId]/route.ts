import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get a single assessment with marks
export async function GET(req: NextRequest, { params }: { params: { assessmentId: string } }) {
  try {
    const { assessmentId } = params;

    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        marks: true,
        subject: {
          include: {
            section: {
              include: {
                course: true
              }
            }
          }
        }
      }
    });

    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error("Failed to fetch assessment:", error);
    return NextResponse.json(
      { message: "Failed to fetch assessment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Delete an assessment
export async function DELETE(req: NextRequest, { params }: { params: { assessmentId: string } }) {
  try {
    const { assessmentId } = params;

    // Check if assessment exists
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId }
    });

    if (!assessment) {
      return NextResponse.json(
        { message: "Assessment not found" },
        { status: 404 }
      );
    }

    // Delete marks associated with the assessment first
    await prisma.assessmentMark.deleteMany({
      where: { assessmentId }
    });

    // Delete the assessment
    await prisma.assessment.delete({
      where: { id: assessmentId }
    });

    return NextResponse.json({
      message: "Assessment deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete assessment:", error);
    return NextResponse.json(
      { message: "Failed to delete assessment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
