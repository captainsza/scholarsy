import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json(
        { message: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get unique semesters from grade records
    const gradeRecords = await prisma.gradeRecord.findMany({
      where: {
        studentId
      },
      select: {
        semester: true
      },
      distinct: ['semester']
    });

    // Extract and sort semesters
    const semesters = gradeRecords
      .map(record => record.semester)
      .sort((a, b) => {
        // Sort by year then semester
        const [seasonA, yearA] = a.split(' ');
        const [seasonB, yearB] = b.split(' ');
        
        if (yearA !== yearB) {
          return parseInt(yearB) - parseInt(yearA); // Most recent year first
        }
        
        // Sort by season: Winter > Fall > Summer
        const seasonOrder = { Winter: 3, Fall: 2, Summer: 1 };
        return seasonOrder[seasonB as keyof typeof seasonOrder] - seasonOrder[seasonA as keyof typeof seasonOrder];
      });

    return NextResponse.json({ semesters });
  } catch (error) {
    console.error("Failed to fetch semesters:", error);
    return NextResponse.json(
      { message: "Failed to fetch semesters" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
