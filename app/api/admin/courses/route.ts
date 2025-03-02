import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all courses
export async function GET(req: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { 
            sections: true,
            registrations: true,
          }
        },
        faculty: {
          select: {
            user: {
              select: {
                profile: {
                  select: {
                    firstName: true,
                    lastName: true,
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        // Changed from createdAt to name since Course model doesn't have createdAt field
        name: 'asc',
      }
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Failed to fetch courses:", error);
    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new course
export async function POST(req: NextRequest) {
  try {
    const { code, name, credits, department } = await req.json();

    // Validate required fields
    if (!code || !name || !credits || !department) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if course code already exists
    const existingCourse = await prisma.course.findUnique({
      where: { code }
    });

    if (existingCourse) {
      return NextResponse.json(
        { message: "Course with this code already exists" },
        { status: 400 }
      );
    }

    // Create the course - REMOVE the description field as it doesn't exist in the schema
    const course = await prisma.course.create({
      data: {
        code,
        name,
        credits,
        department,
      }
    });

    return NextResponse.json(
      { message: "Course created successfully", course },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create course:", error);
    return NextResponse.json(
      { message: "Failed to create course" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
