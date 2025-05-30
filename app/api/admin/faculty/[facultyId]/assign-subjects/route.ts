import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// POST - assign subjects to faculty
export async function POST(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
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

    const facultyId = params.facultyId;
    const { subjectIds } = await req.json();

    // Validate faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!faculty) {
      return NextResponse.json(
        { message: 'Faculty member not found' },
        { status: 404 }
      );
    }

    // Start transaction to update subject assignments
    await prisma.$transaction(async (tx) => {
      // First, remove faculty from all subjects currently assigned to this faculty
      await tx.subject.updateMany({
        where: { facultyId: facultyId },
        data: { facultyId: null }
      });

      // Then assign the new subjects to this faculty
      if (subjectIds && subjectIds.length > 0) {
        await tx.subject.updateMany({
          where: { 
            id: { in: subjectIds }
          },
          data: { facultyId: facultyId }
        });
      }
    });

    // Fetch updated faculty data with new assignments
    const updatedFaculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        subjects: {
          include: {
            course: true
          }
        },
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Subject assignments updated successfully',
      faculty: updatedFaculty
    });
  } catch (error: any) {
    console.error('Error assigning subjects:', error);
    return NextResponse.json(
      { message: 'Failed to assign subjects', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// GET - get current subject assignments for faculty
export async function GET(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
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

    const facultyId = params.facultyId;

    // Get faculty with current subject assignments
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        subjects: {
          include: {
            course: true
          }
        },
        user: {
          include: {
            profile: true
          }
        }
      }
    });

    if (!faculty) {
      return NextResponse.json(
        { message: 'Faculty member not found' },
        { status: 404 }
      );
    }

    // Get all available subjects
    const allSubjects = await prisma.subject.findMany({
      include: {
        course: true,
        faculty: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Transform subjects data
    const transformedSubjects = allSubjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      department: subject.course?.department || 'N/A',
      credits: subject.creditHours,
      courseName: subject.course?.name || 'N/A',
      currentFacultyId: subject.facultyId,
      currentFacultyName: subject.faculty ? 
        `${subject.faculty.user.profile?.firstName || ''} ${subject.faculty.user.profile?.lastName || ''}`.trim() : 
        null,
      isAssignedToCurrentFaculty: subject.facultyId === facultyId
    }));

    return NextResponse.json({
      faculty,
      subjects: transformedSubjects
    });
  } catch (error: any) {
    console.error('Error fetching subject assignments:', error);
    return NextResponse.json(
      { message: 'Failed to fetch subject assignments', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
