import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all subjects for a section
export async function GET(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const sectionId = params.sectionId;
    
    const subjects = await prisma.subject.findMany({
      where: { sectionId },
      include: {
        faculty: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        _count: {
          select: { 
            attendances: true,
            assessments: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error("Failed to fetch subjects:", error);
    return NextResponse.json(
      { message: "Failed to fetch subjects" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new subject for a section
export async function POST(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const sectionId = params.sectionId;
    const { name, code, description, creditHours, facultyId } = await req.json();

    // Validate required fields
    if (!name || !code || !creditHours) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if section exists
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: { course: true }
    });

    if (!section) {
      return NextResponse.json(
        { message: "Section not found" },
        { status: 404 }
      );
    }

    // Check if subject code is unique
    const existingSubject = await prisma.subject.findFirst({
      where: { code, sectionId }
    });

    if (existingSubject) {
      return NextResponse.json(
        { message: "A subject with this code already exists in this section" },
        { status: 400 }
      );
    }

    // Create the subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        creditHours,
        sectionId,
        facultyId: facultyId || undefined
      }
    });

    return NextResponse.json(
      { message: "Subject created successfully", subject },
      { status: 201 }
    );
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
