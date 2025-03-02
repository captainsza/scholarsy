import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// POST: Bulk create or update internal marks
export async function POST(req: NextRequest) {
  try {
    const { marks } = await req.json();
    
    if (!marks || !Array.isArray(marks) || marks.length === 0) {
      return NextResponse.json(
        { message: "Invalid marks data. Expected non-empty array." },
        { status: 400 }
      );
    }

    // Check if we need to map subjectId to courseId
    if (marks[0].subjectId && !marks[0].courseId) {
      // Get all subjects at once
      const subjectIds = [...new Set(marks.map(mark => mark.subjectId))];
      const subjects = await prisma.subject.findMany({
        where: { id: { in: subjectIds } },
        include: {
          section: {
            include: {
              course: true
            }
          }
        }
      });

      // Create a mapping from subjectId to courseId
      const courseMapping: { [key: string]: string } = {};
      subjects.forEach(subject => {
        courseMapping[subject.id] = subject.section.courseId;
      });

      // Update marks with courseId
      marks.forEach(mark => {
        mark.courseId = courseMapping[mark.subjectId];
        delete mark.subjectId; // Remove subjectId as it's not in the schema
      });
    }

    // Process each mark record to create or update
    const records = await Promise.all(marks.map(async (mark) => {
      const { id, studentId, facultyId, courseId, sessionalMark, attendanceMark, totalMark, semester } = mark;
      
      // Validate required fields
      if (!studentId || !facultyId || !courseId || !semester || 
          sessionalMark === undefined || attendanceMark === undefined || totalMark === undefined) {
        throw new Error(`Invalid mark data for student ${studentId}`);
      }

      // Create or update the record
      if (id) {
        // Update existing record
        return prisma.gradeRecord.update({
          where: { id },
          data: {
            sessionalMark,
            attendanceMark,
            totalMark,
            updatedAt: new Date()
          }
        });
      } else {
        // Create new record
        return prisma.gradeRecord.create({
          data: {
            studentId,
            facultyId,
            courseId,
            sessionalMark,
            attendanceMark,
            totalMark,
            semester
          }
        });
      }
    }));

    return NextResponse.json({
      message: "Internal marks saved successfully",
      count: records.length,
      records
    });
  } catch (error) {
    console.error("Failed to save internal marks:", error);
    return NextResponse.json(
      { message: "Failed to save internal marks" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
