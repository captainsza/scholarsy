import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all courses for a student - simplified without auth checks
export async function GET(req: NextRequest) {
  try {
    // Get student ID from query params instead of auth checks
    const studentId = req.nextUrl.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ message: "Student ID is required" }, { status: 400 });
    }

    // Get all sections the student is enrolled in
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: { 
        studentId,
        status: "ACTIVE" 
      },
      include: {
        section: {
          include: {
            course: {
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
            }
          }
        }
      }
    });

    // Format the response
    const courses = enrollments.map(enrollment => {
      const { section } = enrollment;
      const { course } = section;
      
      return {
        id: course.id,
        code: course.code,
        name: course.name,
        credits: course.credits,
        department: course.department,
        description: course.description,
        faculty: course.faculty ? {
          name: `${course.faculty.user.profile.firstName} ${course.faculty.user.profile.lastName}`,
          department: course.faculty.department
        } : null,
        section: {
          id: section.id,
          name: section.name,
          academicTerm: section.academicTerm
        },
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt
        },
        progress: Math.floor(Math.random() * 100)
      };
    });

    return NextResponse.json({ courses });
  } catch (error) {
    console.error("Failed to fetch student courses:", error);
    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
