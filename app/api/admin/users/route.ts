import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Get all users
export async function GET(req: NextRequest) {
  try {
    const role = req.nextUrl.searchParams.get("role");
    const pendingOnly = req.nextUrl.searchParams.get("pendingOnly") === "true";
    
    let whereClause: any = {};
    
    // Add role filter if specified
    if (role && role !== "all") {
      whereClause.role = role;
    }
    
    // Add approval status filter if specified
    if (pendingOnly) {
      whereClause.isApproved = false;
    }
    
    const users = await prisma.user.findMany({
      where: whereClause,
      include: {
        profile: true,
        student: {
          select: {
            id: true,
            enrollmentId: true,
            department: true,
          }
        },
        faculty: {
          select: {
            id: true,
            department: true,
          }
        },
        admin: {
          select: {
            id: true,
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    // Remove password from the response
    const safeUsers = users.map(({ password, ...rest }) => rest);

    return NextResponse.json({ users: safeUsers });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { message: "Failed to fetch users" },
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
