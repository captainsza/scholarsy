import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all courses for a faculty member - simplified without auth checks
export async function GET(req: NextRequest) {
  try {
    // Get faculty ID from query params instead of auth checks
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json({ message: "Faculty ID is required" }, { status: 400 });
    }
    
    // Get courses where faculty is assigned
    const courses = await prisma.course.findMany({
      where: { 
        facultyId 
      },
      include: {
        sections: {
          include: {
            _count: {
              select: {
                enrollments: true,
                subjects: true
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Also get courses where faculty teaches specific subjects
    const subjectCourses = await prisma.subject.findMany({
      where: {
        facultyId
      },
      select: {
        section: {
          include: {
            course: {
              include: {
                sections: {
                  include: {
                    _count: {
                      select: {
                        enrollments: true,
                        subjects: true
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

    // Combine both result sets
    const additionalCourses = subjectCourses.map(s => s.section.course);
    
    const allCourses = [...courses];
    for (const course of additionalCourses) {
      if (!allCourses.some(c => c.id === course.id)) {
        allCourses.push(course);
      }
    }

    return NextResponse.json({ courses: allCourses });
  } catch (error) {
    console.error("Failed to fetch faculty courses:", error);
    return NextResponse.json(
      { message: "Failed to fetch courses" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
