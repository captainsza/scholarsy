import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get a single enrollment
export async function GET(req: NextRequest, { params }: { params: { sectionId: string, enrollmentId: string } }) {
  try {
    const { enrollmentId } = params;
    
    const enrollment = await prisma.sectionEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        student: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        section: {
          include: {
            course: true
          }
        }
      }
    });

    if (!enrollment) {
      return NextResponse.json(
        { message: "Enrollment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ enrollment });
  } catch (error) {
    console.error("Failed to fetch enrollment:", error);
    return NextResponse.json(
      { message: "Failed to fetch enrollment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update enrollment status
export async function PATCH(req: NextRequest, { params }: { params: { sectionId: string, enrollmentId: string } }) {
  try {
    const { enrollmentId } = params;
    const { status } = await req.json();
    
    // Validate status is valid
    const validStatuses = ["ACTIVE", "DROPPED", "COMPLETED", "ON_HOLD"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid enrollment status" },
        { status: 400 }
      );
    }

    // Update the enrollment status
    const updatedEnrollment = await prisma.sectionEnrollment.update({
      where: { id: enrollmentId },
      data: { status },
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
    });

    return NextResponse.json({
      message: "Enrollment status updated successfully",
      enrollment: updatedEnrollment
    });
  } catch (error) {
    console.error("Failed to update enrollment status:", error);
    return NextResponse.json(
      { message: "Failed to update enrollment status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete an enrollment
export async function DELETE(req: NextRequest, { params }: { params: { sectionId: string, enrollmentId: string } }) {
  try {
    const { enrollmentId } = params;
    
    await prisma.sectionEnrollment.delete({
      where: { id: enrollmentId }
    });

    return NextResponse.json({ message: "Enrollment deleted successfully" });
  } catch (error) {
    console.error("Failed to delete enrollment:", error);
    return NextResponse.json(
      { message: "Failed to delete enrollment" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
