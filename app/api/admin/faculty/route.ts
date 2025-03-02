import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all faculty members
export async function GET(req: NextRequest) {
  try {
    const faculty = await prisma.faculty.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        user: {
          profile: {
            firstName: 'asc'
          }
        }
      }
    });

    return NextResponse.json({ faculty });
  } catch (error) {
    console.error("Failed to fetch faculty:", error);
    return NextResponse.json(
      { message: "Failed to fetch faculty" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new faculty member (for admin use)
export async function POST(req: NextRequest) {
  try {
    const { userId, department } = await req.json();

    // Validate required fields
    if (!userId || !department) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if user exists and is not already assigned a faculty role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        faculty: true
      }
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    if (user.faculty) {
      return NextResponse.json(
        { message: "This user is already a faculty member" },
        { status: 400 }
      );
    }

    // Create faculty record
    const faculty = await prisma.faculty.create({
      data: {
        userId,
        department
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    // Update user role if needed
    if (user.role !== "FACULTY") {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "FACULTY" }
      });
    }

    return NextResponse.json(
      { message: "Faculty created successfully", faculty },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create faculty:", error);
    return NextResponse.json(
      { message: "Failed to create faculty" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
