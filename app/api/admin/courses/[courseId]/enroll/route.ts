import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// POST - Enroll students in a course
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

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    const courseId = params.courseId;
    const { studentIds } = await req.json();
    
    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return NextResponse.json(
        { message: 'Student IDs are required' },
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

    // Create enrollments for students
    const enrollmentPromises = studentIds.map(async (studentId) => {
      // Check if enrollment already exists
      const existingEnrollment = await prisma.courseEnrollment.findFirst({
        where: {
          studentId,
          courseId,
        },
      });

      if (existingEnrollment) {
        return existingEnrollment;
      }

      // Create new enrollment
      return prisma.courseEnrollment.create({
        data: {
          studentId,
          courseId,
          status: 'ACTIVE',
        },
      });
    });

    const enrollments = await Promise.all(enrollmentPromises);

    return NextResponse.json({ 
      message: 'Students enrolled successfully',
      count: enrollments.length,
    });
  } catch (error: any) {
    console.error('Enrollment error:', error);
    return NextResponse.json(
      { message: 'Failed to enroll students', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - Get enrollment status for all students
export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string } }
) {
  try {
    // Verify authentication
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const courseId = params.courseId;

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

    // Get all students with their enrollment status for this course
    const students = await prisma.student.findMany({
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // Get enrollments for this course
    const enrollments = await prisma.courseEnrollment.findMany({
      where: { courseId },
    });

    // Map enrollment status to students
    const studentsWithStatus = students.map(student => {
      const enrollment = enrollments.find(e => e.studentId === student.id);
      
      return {
        id: student.id,
        enrollmentId: student.enrollmentId,
        user: {
          profile: student.user.profile,
        },
        department: student.department,
        isEnrolled: !!enrollment,
        enrollmentStatus: enrollment?.status || null,
      };
    });

    return NextResponse.json({ students: studentsWithStatus });
  } catch (error: any) {
    console.error('Error fetching enrollment status:', error);
    return NextResponse.json(
      { message: 'Failed to fetch enrollment status', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
