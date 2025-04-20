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
    
    // Build the query
    const where: any = {};
    if (departmentFilter && departmentFilter !== 'all') {
      where.department = departmentFilter;
    }
    
    // Fetch faculty with related info
    const faculty = await prisma.faculty.findMany({
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
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        courses: {
          select: {
            id: true,
            name: true,
            branch: true,
            semester: true,
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
    
    return NextResponse.json({ faculty });
  } catch (error: any) {
    console.error('Faculty fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST to create a new faculty member
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
    
    const { userId, department } = await req.json();
    
    if (!userId || !department) {
      return NextResponse.json(
        { message: 'User ID and department are required' }, 
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
    
    // Check if faculty record already exists for this user
    const existingFaculty = await prisma.faculty.findUnique({
      where: { userId },
    });
    
    if (existingFaculty) {
      return NextResponse.json(
        { message: 'Faculty record already exists for this user' }, 
        { status: 400 }
      );
    }
    
    // Create the faculty record
    const faculty = await prisma.faculty.create({
      data: {
        userId,
        department,
      },
    });
    
    return NextResponse.json(faculty);
  } catch (error: any) {
    console.error('Faculty creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create faculty' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
