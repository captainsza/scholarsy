import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all subjects for a specific faculty
export async function GET(req: NextRequest) {
  try {
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json({ message: "Faculty ID is required" }, { status: 400 });
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    });

    if (!faculty) {
      return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
    }

    // Get subjects directly assigned to faculty
    const subjects = await prisma.subject.findMany({
      where: { facultyId },
      include: {
        section: {
          include: {
            course: true,
            enrollments: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Also get subjects from courses where faculty is the course coordinator
    const courseSubjects = await prisma.subject.findMany({
      where: {
        section: {
          course: {
            facultyId
          }
        },
        facultyId: null // Only get subjects not directly assigned to a faculty
      },
      include: {
        section: {
          include: {
            course: true,
            enrollments: {
              where: { status: 'ACTIVE' }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Combine both sets of subjects, avoiding duplicates
    const allSubjects = [...subjects];
    for (const subject of courseSubjects) {
      // Check if this subject is already included
      if (!allSubjects.some(s => s.id === subject.id)) {
        allSubjects.push(subject);
      }
    }

    return NextResponse.json({ subjects: allSubjects });
  } catch (error) {
    console.error("Failed to fetch faculty subjects:", error);
    return NextResponse.json(
      { message: "Failed to fetch faculty subjects" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new subject assigned to this faculty
export async function POST(req: NextRequest) {
  try {
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json({ message: "Faculty ID is required" }, { status: 400 });
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    });

    if (!faculty) {
      return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
    }

    // Parse request body
    const { name, code, description, creditHours, sectionId } = await req.json();
    
    // Validate required fields
    if (!name || !code || !sectionId || !creditHours) {
      return NextResponse.json(
        { message: "Missing required fields: name, code, sectionId, creditHours" },
        { status: 400 }
      );
    }

    // Check if section exists
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      return NextResponse.json({ message: "Section not found" }, { status: 404 });
    }

    // Create the new subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        creditHours,
        sectionId,
        facultyId
      }
    });

    return NextResponse.json({ 
      message: "Subject created successfully",
      subject
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create subject:", error);
    return NextResponse.json(
      { message: "Failed to create subject" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
