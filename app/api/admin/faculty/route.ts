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
    
    // Check role-based access
    if (!['ADMIN', 'FACULTY'].includes(decoded.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get faculty list
    const facultyList = await prisma.faculty.findMany({
      include: {
        user: {
          include: {
            profile: true
          }
        }
      },
      orderBy: {
        user: {
          profile: {
            firstName: 'asc'
          }
        }
      }
    });
    
    // Transform for frontend
    const faculty = facultyList.map(f => ({
      id: f.id,
      name: f.user.profile 
        ? `${f.user.profile.firstName} ${f.user.profile.lastName}` 
        : `Faculty ID: ${f.id}`,
      email: f.user.email,
      department: f.department
    }));
    
    return NextResponse.json({ faculty });
  } catch (error: any) {
    console.error('Faculty fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty list', error: error.message }, 
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
