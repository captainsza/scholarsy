import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// GET - get all subjects
export async function GET(req: NextRequest) {
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
    
    // Get all subjects with related data
    const subjects = await prisma.subject.findMany({
      include: {
        faculty: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        course: true
      },
      orderBy: { name: 'asc' }
    });
    
    // Transform subject data for frontend
    const transformedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      department: subject.course?.department || 'N/A',
      credits: subject.creditHours,
      facultyId: subject.facultyId,
      facultyName: subject.faculty ? 
        `${subject.faculty.user.profile?.firstName || ''} ${subject.faculty.user.profile?.lastName || ''}`.trim() : 
        null,
      courseName: subject.course?.name || 'N/A'
    }));
    
    return NextResponse.json(transformedSubjects);
  } catch (error: any) {
    console.error('Subjects fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subjects', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
