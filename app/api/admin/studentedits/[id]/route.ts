import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get a specific student by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id; // Changed from params.studentId to params.id
    
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isApproved: true,
            emailVerified: true,
            role: true,
            profile: true
          }
        }
      }
    });
    
    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ student });
  } catch (error) {
    console.error("Failed to fetch student:", error);
    return NextResponse.json(
      { message: "Failed to fetch student" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update a student
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id; // Changed from params.studentId to params.id
    const data = await req.json();
    
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId }
    });
    
    if (!existingStudent) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }
    
    // Extract user-related data
    const { user, ...studentData } = data;
    
    // Handle date format conversion for dob if present
    if (studentData.dob) {
      try {
        // Ensure dob is a properly formatted date
        // If it's just a date string like "YYYY-MM-DD", append time to make it a valid DateTime
        const dobString = studentData.dob;
        if (dobString.length === 10) { // Just a date string "YYYY-MM-DD"
          studentData.dob = new Date(`${dobString}T00:00:00Z`);
        } else {
          studentData.dob = new Date(dobString);
        }
        
        // Check if the date is valid
        if (isNaN(studentData.dob.getTime())) {
          throw new Error("Invalid date format");
        }
      } catch (error) {
        return NextResponse.json(
          { message: "Invalid date format for date of birth. Please use YYYY-MM-DD format." },
          { status: 400 }
        );
      }
    }
    
    // Update in a transaction to ensure all updates succeed or fail together
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update the student record
      const student = await tx.student.update({
        where: { id: studentId },
        data: studentData,
        include: {
          user: {
            include: {
              profile: true
            }
          }
        }
      });
      
      // Update user and profile if provided
      if (user) {
        // Update user fields (email, isApproved, emailVerified)
        await tx.user.update({
          where: { id: student.userId },
          data: {
            email: user.email,
            isApproved: user.isApproved,
            emailVerified: user.emailVerified
          }
        });
        
        // Update profile fields if provided
        if (user.profile) {
          await tx.profile.update({
            where: { userId: student.userId },
            data: {
              firstName: user.profile.firstName,
              lastName: user.profile.lastName,
              phone: user.profile.phone
            }
          });
        }
      }
      
      // Return the updated student with fresh user data
      return tx.student.findUnique({
        where: { id: studentId },
        include: {
          user: {
            include: {
              profile: true
            }
          }
        }
      });
    });
    
    return NextResponse.json({
      message: "Student updated successfully",
      student: updatedStudent
    });
  } catch (error) {
    console.error("Failed to update student:", error);
    return NextResponse.json(
      { message: `Failed to update student: ${(error as Error).message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a student
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id; // Changed from params.studentId to params.id
    
    // Check if student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: { user: true }
    });
    
    if (!existingStudent) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }
    
    // Delete the student and associated records in a transaction
    await prisma.$transaction(async (tx) => {
      // First delete the student record
      await tx.student.delete({
        where: { id: studentId }
      });
      
      // Then delete the profile
      await tx.profile.deleteMany({
        where: { userId: existingStudent.userId }
      });
      
      // Finally delete the user
      await tx.user.delete({
        where: { id: existingStudent.userId }
      });
    });
    
    return NextResponse.json({
      message: "Student deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete student:", error);
    return NextResponse.json(
      { message: "Failed to delete student" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
