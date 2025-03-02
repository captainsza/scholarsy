import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get a single course
export async function GET(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId; // Changed from params.id to params.courseId
    
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        sections: {
          include: {
            _count: {
              select: { 
                subjects: true,
                enrollments: true 
              }
            }
          },
          orderBy: {
            name: 'asc' // Changed from createdAt since CourseSection might not have this field
          }
        },
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
    });

    if (!course) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ course });
  } catch (error) {
    console.error("Failed to fetch course:", error);
    return NextResponse.json(
      { message: "Failed to fetch course" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update a course
export async function PUT(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId; // Changed from params.id to params.courseId
    const { code, name, credits, department, description, facultyId } = await req.json();

    const updatedCourse = await prisma.course.update({
      where: { id: courseId },
      data: {
        code,
        name,
        credits,
        department,
        description,
        facultyId
      }
    });

    return NextResponse.json({ 
      message: "Course updated successfully", 
      course: updatedCourse 
    });
  } catch (error) {
    console.error("Failed to update course:", error);
    return NextResponse.json(
      { message: "Failed to update course" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a course
export async function DELETE(req: NextRequest, { params }: { params: { courseId: string } }) {
  try {
    const courseId = params.courseId; // Changed from params.id to params.courseId
    
    // First, check if there are sections or registrations associated with this course
    const courseWithRelations = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        _count: {
          select: {
            sections: true,
            registrations: true
          }
        }
      }
    });
    
    if (!courseWithRelations) {
      return NextResponse.json(
        { message: "Course not found" },
        { status: 404 }
      );
    }
    
    // Don't allow deletion if there are related records
    if (courseWithRelations._count.sections > 0 || courseWithRelations._count.registrations > 0) {
      return NextResponse.json(
        { message: "Cannot delete course with existing sections or registrations" },
        { status: 400 }
      );
    }
    
    await prisma.course.delete({
      where: { id: courseId }
    });

    return NextResponse.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Failed to delete course:", error);
    return NextResponse.json(
      { message: "Failed to delete course" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
