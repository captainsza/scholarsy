import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET endpoint to fetch courses
export async function GET(req: NextRequest) {
  try {
    const courses = await prisma.course.findMany({
      include: {
        _count: {
          select: { 
            registrations: true,
            subjects: true, // Add this line to count subjects
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

// POST endpoint to create a new course with subjects
export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    
    // Get course data from request body but explicitly exclude code
    const { name, branch, year, semester, credits, description, facultyId, subjects } = await req.json();
    
    // Validate required fields without requiring code
    if (!name || !branch || !year || !semester) {
      return NextResponse.json(
        { message: 'Course name, branch, year and semester are required' }, 
        { status: 400 }
      );
    }
    
    // Create course with subjects in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the course first - explicitly specify only the fields we want
      const course = await tx.course.create({
        data: {
          name,
          branch,
          year,
          semester,
          credits: credits || null,
          description,
          facultyId: facultyId || null,
        },
      });
      
      // If subjects are provided, create them
      if (subjects && Array.isArray(subjects) && subjects.length > 0) {
        for (const subject of subjects) {
          // Validate required subject fields
          if (!subject.name || !subject.code) {
            throw new Error('Subject name and code are required');
          }
          
          await tx.subject.create({
            data: {
              name: subject.name,
              code: subject.code,
              description: subject.description || null,
              creditHours: subject.creditHours || 3,
              courseId: course.id, // Direct relationship to course
              facultyId: subject.facultyId || null,
            },
          });
        }
      }
      
      // Return the created course
      return course;
    });
    
    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error('Course creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create course', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
