import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get authentication token
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Student access required' }, { status: 403 });
    }
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Get student record
    const student = await prisma.student.findFirst({
      where: { userId: user.id },
      include: {
        registrations: {
          select: {
            courseId: true
          }
        },
        courseEnrollments: {  // Updated from sectionEnrollments to courseEnrollments
          select: {
            courseId: true  // Updated from sectionId to courseId
          }
        }
      }
    });
    
    if (!student) {
      return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
    }

    // Extract course IDs from registrations and enrollments
    const courseIds = [
      ...student.registrations.map(reg => reg.courseId),
      ...student.courseEnrollments.map(enroll => enroll.courseId) // Updated to use courseEnrollments
    ];

    // Get student's department
    const department = student.department;

    // Fetch all relevant notices for the student
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        OR: [
          { targetType: 'ALL' },
          {
            targetType: 'ROLE',
            targetUserRoles: { has: 'STUDENT' }
          },
          {
            targetType: 'DEPARTMENT',
            targetDepartments: { has: department }
          },
          {
            targetType: 'COURSE',
            targetCourseIds: { hasSome: courseIds }
          }
        ],
        // Only get notices that haven't expired
        AND: [
          {
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: new Date() } }
            ]
          }
        ]
      },
      orderBy: {
        publishDate: 'desc'
      }
    });

    return NextResponse.json({ notices });
  } catch (error: any) {
    console.error('Student notices fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notices', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}