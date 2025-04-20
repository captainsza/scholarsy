import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - get all subjects for a course
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    const courseId = params.courseId;

    if (!courseId) {
      return NextResponse.json({ message: 'Course ID is required' }, { status: 400 });
    }

    // Get subjects for the course
    const subjects = await prisma.subject.findMany({
      where: { courseId },
      include: {
        faculty: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ subjects });
  } catch (error: any) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subjects' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST - create a new subject for a course
export async function POST(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify authentication
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const courseId = params.courseId;
    const { name, code, description, creditHours, facultyId } = await req.json();

    // Validate required fields
    if (!name || !code) {
      return NextResponse.json(
        { message: 'Subject name and code are required' },
        { status: 400 }
      );
    }

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 }
      );
    }

    // Create subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        creditHours: creditHours || 3,
        courseId,
        facultyId: facultyId || null,
      },
    });

    return NextResponse.json(subject, { status: 201 });
  } catch (error: any) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { message: 'Failed to create subject', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
