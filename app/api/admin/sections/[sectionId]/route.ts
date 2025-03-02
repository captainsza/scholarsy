import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get a single section
export async function GET(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const sectionId = params.sectionId; // Changed from params.id to params.sectionId
    
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        course: true,
        subjects: {
          include: {
            faculty: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        },
        enrollments: {
          include: {
            student: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!section) {
      return NextResponse.json(
        { message: "Section not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error("Failed to fetch section:", error);
    return NextResponse.json(
      { message: "Failed to fetch section" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update a section
export async function PUT(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const sectionId = params.sectionId; // Changed from params.id to params.sectionId
    const { name, academicTerm, capacity } = await req.json();

    const updatedSection = await prisma.courseSection.update({
      where: { id: sectionId },
      data: {
        name,
        academicTerm,
        capacity
      }
    });

    return NextResponse.json({ 
      message: "Section updated successfully", 
      section: updatedSection 
    });
  } catch (error) {
    console.error("Failed to update section:", error);
    return NextResponse.json(
      { message: "Failed to update section" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a section
export async function DELETE(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const sectionId = params.sectionId; // Changed from params.id to params.sectionId
    
    // Check if there are subjects or enrollments associated with this section
    const sectionWithRelations = await prisma.courseSection.findUnique({
      where: { id: sectionId },
      include: {
        _count: {
          select: {
            subjects: true,
            enrollments: true
          }
        }
      }
    });
    
    if (!sectionWithRelations) {
      return NextResponse.json(
        { message: "Section not found" },
        { status: 404 }
      );
    }
    
    // Don't allow deletion if there are related records
    if (sectionWithRelations._count.subjects > 0 || sectionWithRelations._count.enrollments > 0) {
      return NextResponse.json(
        { message: "Cannot delete section with existing subjects or enrollments" },
        { status: 400 }
      );
    }
    
    await prisma.courseSection.delete({
      where: { id: sectionId }
    });

    return NextResponse.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error("Failed to delete section:", error);
    return NextResponse.json(
      { message: "Failed to delete section" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
