import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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
    
    // Get search parameters
    const searchParams = req.nextUrl.searchParams;
    const departmentFilter = searchParams.get('department');
    const semesterFilter = searchParams.get('semester');
    
    // Build the query
    const where: any = {};
    if (departmentFilter && departmentFilter !== 'all') {
      where.department = departmentFilter;
    }
    if (semesterFilter && semesterFilter !== 'all') {
      where.currentSemester = semesterFilter;
    }
    
    // Fetch all students with related info
    const students = await prisma.student.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isApproved: true,
            emailVerified: true,
            createdAt: true,
            profile: true,
          },
        },
        courseEnrollments: {
          include: {
            course: true,
          },
        },
      },
      orderBy: {
        user: {
          profile: {
            firstName: 'asc',
          },
        },
      },
    });
    
    return NextResponse.json({ students });
  } catch (error: any) {
    console.error('Students fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch students' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST to create a new student
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
    
    const {
      userId,
      enrollmentId,
      department,
      // Additional student fields
      gender,
      dob,
      bloodGroup,
      fatherName,
      motherName,
      admissionSession,
      admissionSemester,
      academicStatus,
      instituteName,
      courseName,
      branchName,
      currentSemester,
      address,
      city,
      state,
      country,
      pincode
    } = await req.json();
    
    if (!userId || !enrollmentId || !department) {
      return NextResponse.json(
        { message: 'User ID, enrollment ID, and department are required' }, 
        { status: 400 }
      );
    }
    
    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!userExists) {
      return NextResponse.json(
        { message: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Check if student record already exists for this user
    const existingStudent = await prisma.student.findUnique({
      where: { userId },
    });
    
    if (existingStudent) {
      return NextResponse.json(
        { message: 'Student record already exists for this user' }, 
        { status: 400 }
      );
    }
    
    // Check if enrollment ID is already in use
    const enrollmentExists = await prisma.student.findUnique({
      where: { enrollmentId },
    });
    
    if (enrollmentExists) {
      return NextResponse.json(
        { message: 'Enrollment ID is already in use' }, 
        { status: 400 }
      );
    }
    
    // Parse date of birth if provided
    const parsedDob = dob ? new Date(dob) : undefined;
    
    // Create the student record
    const student = await prisma.student.create({
      data: {
        userId,
        enrollmentId,
        department,
        gender,
        dob: parsedDob,
        bloodGroup,
        fatherName,
        motherName,
        admissionSession,
        admissionSemester,
        academicStatus,
        instituteName,
        courseName,
        branchName,
        currentSemester,
        address,
        city,
        state,
        country,
        pincode
      },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    return NextResponse.json(student);
  } catch (error: any) {
    console.error('Student creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create student' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
