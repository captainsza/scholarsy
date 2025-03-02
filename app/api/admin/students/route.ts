import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get students with optional filtering
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const notInSection = url.searchParams.get('notInSection');
    const department = url.searchParams.get('department');
    const search = url.searchParams.get('search');
    
    // Base query
    let whereClause: any = {};
    
    // Add filters
    if (department) {
      whereClause.department = department;
    }
    
    // Add search functionality
    if (search) {
      whereClause.OR = [
        {
          enrollmentId: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          user: {
            profile: {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: 'insensitive'
                  }
                },
                {
                  lastName: {
                    contains: search,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          }
        }
      ];
    }

    // Fetch students
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    // If we need to filter students not in a specific section
    if (notInSection) {
      // Fetch IDs of students already enrolled in the section
      const enrolledStudentIds = (await prisma.sectionEnrollment.findMany({
        where: { sectionId: notInSection },
        select: { studentId: true }
      })).map(enrollment => enrollment.studentId);
      
      // Filter out students who are already enrolled
      const filteredStudents = students.filter(student => 
        !enrolledStudentIds.includes(student.id)
      );
      
      return NextResponse.json({ students: filteredStudents });
    }

    return NextResponse.json({ students });
  } catch (error) {
    console.error("Failed to fetch students:", error);
    return NextResponse.json(
      { message: "Failed to fetch students" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
