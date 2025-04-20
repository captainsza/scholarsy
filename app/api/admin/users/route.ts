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
    
    // Get query parameters
    const { searchParams } = req.nextUrl;
    const roleFilter = searchParams.get('role');
    const searchQuery = searchParams.get('search') || '';
    const approvalFilter = searchParams.get('approval') || 'all';
    const emailVerifiedFilter = searchParams.get('emailVerified') || 'verified';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;
    
    // Build the where clause based on filters
    const where: any = {};
    
    // Role filter
    if (roleFilter && ['ADMIN', 'FACULTY', 'STUDENT'].includes(roleFilter)) {
      where.role = roleFilter;
    }
    
    // Search query
    if (searchQuery) {
      where.OR = [
        { email: { contains: searchQuery, mode: 'insensitive' } },
        { 
          profile: { 
            OR: [
              { firstName: { contains: searchQuery, mode: 'insensitive' } },
              { lastName: { contains: searchQuery, mode: 'insensitive' } }
            ]
          } 
        }
      ];
    }
    
    // Approval status filter
    if (approvalFilter === 'pending') {
      where.isApproved = false;
    } else if (approvalFilter === 'approved') {
      where.isApproved = true;
    }
    
    // Email verification filter
    if (emailVerifiedFilter === 'verified') {
      where.emailVerified = true;
    } else if (emailVerifiedFilter === 'unverified') {
      where.emailVerified = false;
    }
    
    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      include: {
        profile: true,
        student: true,
        faculty: true,
        admin: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });
    
    // Remove sensitive information (password)
    const safeUsers = users.map(user => {
      const { password, ...safeUser } = user;
      return safeUser;
    });
    
    // Get total count for pagination
    const totalUsers = await prisma.user.count({ where });
    const totalPages = Math.ceil(totalUsers / limit);
    
    return NextResponse.json({
      users: safeUsers,
      pagination: {
        totalUsers,
        totalPages,
        currentPage: page,
        pageSize: limit,
      }
    });
  } catch (error: any) {
    console.error('User fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch users' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new user
export async function POST(req: NextRequest) {
  try {
    const { 
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      phone, 
      isApproved,
      // Student specific fields
      enrollmentId,
      department
    } = await req.json();
    
    // Validate required fields
    if (!email || !password || !role || !firstName || !lastName) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Check for existing user with the same email
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: "User with this email already exists" },
        { status: 400 }
      );
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create the user and profile in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role,
          isApproved: isApproved ?? false,
          profile: {
            create: {
              firstName,
              lastName,
              phone
            }
          }
        }
      });
      
      // If student role, create student record
      if (role === "STUDENT" && enrollmentId && department) {
        await tx.student.create({
          data: {
            userId: user.id,
            enrollmentId,
            department
          }
        });
      }
      
      // If faculty role, create faculty record
      if (role === "FACULTY" && department) {
        await tx.faculty.create({
          data: {
            userId: user.id,
            department
          }
        });
      }
      
      // If admin role, create admin record
      if (role === "ADMIN") {
        await tx.admin.create({
          data: {
            userId: user.id
          }
        });
      }
      
      return user;
    });
    
    // Remove password from the response
    const { password: _, ...safeUser } = result;
    
    return NextResponse.json(
      { message: "User created successfully", user: safeUser },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create user:", error);
    return NextResponse.json(
      { message: "Failed to create user" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
