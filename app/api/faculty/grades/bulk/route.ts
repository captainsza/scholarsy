import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Bulk create or update assessment marks
export async function POST(req: NextRequest) {
  try {
    const { marks } = await req.json();
    
    if (!marks || !Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json(
        { message: "Invalid marks data. Expected non-empty array." },
        { status: 400 }
      );
    }

    // Get assessments to validate marks
    const assessmentIds = [...new Set(marks.map(m => m.assessmentId))];
    const assessments = await prisma.assessment.findMany({
      where: { id: { in: assessmentIds } }
    });
    
    // Create a map for quick lookup
    const assessmentMap = new Map();
    assessments.forEach(assessment => {
      assessmentMap.set(assessment.id, assessment);
    });

    // Process each mark
    const results = [];
    for (const mark of marks) {
      const { assessmentId, studentId, marksObtained, feedback } = mark;
      
      // Validate required fields
      if (!assessmentId || !studentId || marksObtained === undefined) {
        continue; // Skip invalid entries
      }

      const assessment = assessmentMap.get(assessmentId);
      if (!assessment) {
        continue; // Skip if assessment not found
      }

      // Validate marks
      if (parseFloat(marksObtained) < 0 || parseFloat(marksObtained) > assessment.maxMarks) {
        continue; // Skip invalid marks
      }

      // Check if mark already exists
      const existingMark = await prisma.assessmentMark.findFirst({
        where: {
          assessmentId,
          studentId
        }
      });

      let result;
      if (existingMark) {
        // Update existing
        result = await prisma.assessmentMark.update({
          where: { id: existingMark.id },
          data: {
            marksObtained: parseFloat(marksObtained),
            feedback,
            evaluatedAt: new Date()
          }
        });
      } else {
        // Create new
        result = await prisma.assessmentMark.create({
          data: {
            assessmentId,
            studentId,
            marksObtained: parseFloat(marksObtained),
            feedback,
            evaluatedAt: new Date()
          }
        });
      }
      
      results.push(result);
    }

    return NextResponse.json({
      message: "Grades saved successfully",
      count: results.length,
      marks: results
    });
  } catch (error) {
    console.error("Failed to save grades:", error);
    return NextResponse.json(
      { message: "Failed to save grades" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
