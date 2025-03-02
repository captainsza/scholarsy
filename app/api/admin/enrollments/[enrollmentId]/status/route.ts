import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT: Update enrollment status
export async function PUT(
  req: NextRequest,
  { params }: { params: { enrollmentId: string } }
) {
  try {
    const { enrollmentId } = params;
    const { status } = await req.json();

    // Validate the status
    const validStatuses = ["ACTIVE", "DROPPED", "COMPLETED", "ON_HOLD"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: "Invalid status value. Must be ACTIVE, DROPPED, COMPLETED, or ON_HOLD" },
        { status: 400 }
      );
    }

    // Check if the enrollment exists
    const enrollment = await prisma.sectionEnrollment.findUnique({
      where: { id: enrollmentId }
    });

    if (!enrollment) {
      return NextResponse.json({ message: "Enrollment not found" }, { status: 404 });
    }

    // Update the enrollment status
    const updatedEnrollment = await prisma.sectionEnrollment.update({
      where: { id: enrollmentId },
      data: { status },
      include: {
        student: true,
        section: {
          include: {
            course: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: "Enrollment status updated successfully",
      enrollment: updatedEnrollment,
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
