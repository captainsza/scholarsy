import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Update a user's role
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const { role } = await req.json();
    
    // Check if the role field is provided
    if (!role) {
      return NextResponse.json(
        { message: "Role field is required" },
        { status: 400 }
      );
    }
    
    // Validate role
    if (!['ADMIN', 'FACULTY', 'STUDENT'].includes(role)) {
      return NextResponse.json(
        { message: "Invalid role. Must be ADMIN, FACULTY, or STUDENT" },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: true,
        faculty: true,
        admin: true
      }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // If role is the same, nothing to do
    if (existingUser.role === role) {
      return NextResponse.json({
        message: "User already has this role",
        role
      });
    }
    
    // Update user role in a transaction to handle role-specific records
    await prisma.$transaction(async (tx) => {
      // Update user role
      await tx.user.update({
        where: { id: userId },
        data: { role }
      });
      
      // Create role-specific record if it doesn't exist
      if (role === 'STUDENT' && !existingUser.student) {
        await tx.student.create({
          data: {
            userId,
            enrollmentId: `S${Date.now().toString().substring(7)}`, // Generate a temporary enrollment ID
            department: "Not Assigned" // Default department
          }
        });
      } else if (role === 'FACULTY' && !existingUser.faculty) {
        await tx.faculty.create({
          data: {
            userId,
            department: "Not Assigned" // Default department
          }
        });
      } else if (role === 'ADMIN' && !existingUser.admin) {
        await tx.admin.create({
          data: {
            userId
          }
        });
      }
    });
    
    return NextResponse.json({
      message: "User role updated successfully",
      role
    });
  } catch (error) {
    console.error("Failed to update user role:", error);
    return NextResponse.json(
      { message: "Failed to update role" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
