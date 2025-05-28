import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get a specific user by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Access userId directly without destructuring
    const userId = params.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        student: {
          select: {
            id: true,
            enrollmentId: true,
            department: true,
            gender: true,
            dob: true,
            bloodGroup: true,
            fatherName: true,
            motherName: true,
            admissionSession: true,
            admissionSemester: true,
            academicStatus: true,
            instituteCode: true,
            instituteName: true,
            courseName: true,
            branchName: true,
            currentSemester: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            // Remove reference to sectionEnrollments
          }
        },
        faculty: {
          select: {
            id: true,
            department: true,
            subjects: {
              include: {
                course: true, // Replace section with course
                // Remove section reference
              }
            }
          }
        },
        admin: {
          select: {
            id: true,
            approvals: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Remove password from the response
    const { password, ...safeUser } = user;
    
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("Failed to fetch user:", error);
    return NextResponse.json(
      { message: "Failed to fetch user" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Update a user
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Access userId directly without destructuring
    const userId = params.userId;
    const updates = await req.json();
    
    // Remove any fields that shouldn't be directly updated
    const { password, id, createdAt, updatedAt, ...safeUpdates } = updates;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        student: true,
        faculty: true
      }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Extract fields from profile and prepare updates
    const profileFields = ['firstName', 'lastName', 'phone', 'profileImage'];
    const addressFields = ['address', 'city', 'state', 'country', 'pincode', 'gender'];
    
    // Create safe profile update with only valid fields
    let profileUpdate: Record<string, any> = {};
    if (safeUpdates.profile) {
      profileFields.forEach(field => {
        if (field in safeUpdates.profile) {
          profileUpdate[field] = safeUpdates.profile[field];
        }
      });
    }
    
    // Create student update with address fields and any existing student updates
    let studentUpdate = { ...safeUpdates.student } || {};
    
    // Move address fields from profile to student if user is a student
    if (existingUser.student && safeUpdates.profile) {
      addressFields.forEach(field => {
        if (field in safeUpdates.profile) {
          studentUpdate[field] = safeUpdates.profile[field];
        }
      });
    }
    
    // Update user data with correctly organized fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        email: safeUpdates.email,
        isApproved: safeUpdates.isApproved,
        emailVerified: safeUpdates.emailVerified,
        profile: Object.keys(profileUpdate).length > 0 ? {
          update: profileUpdate
        } : undefined,
        student: existingUser.student && Object.keys(studentUpdate).length > 0 ? {
          update: studentUpdate
        } : undefined,
        faculty: safeUpdates.faculty ? {
          update: safeUpdates.faculty
        } : undefined
      },
      include: {
        profile: true,
        student: true,
        faculty: true,
        admin: true
      }
    });
    
    // Remove password from the response
    const { password: _, ...safeUser } = updatedUser;
    
    return NextResponse.json({ user: safeUser });
  } catch (error) {
    console.error("Failed to update user:", error);
    return NextResponse.json(
      { message: "Failed to update user", error: (error as any).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Delete a user
export async function DELETE(
  req: NextRequest,
  context: { params: { userId: string } }
) {
  try {
    // Access userId directly without destructuring
    const userId = context.params.userId;
    
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
    
    // Delete user and all associated records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete role-specific data first
      if (existingUser.student) {
        // Delete course enrollments first to avoid foreign key constraint violation
        await tx.courseEnrollment.deleteMany({
          where: { studentId: existingUser.student.id }
        });
        
        // Delete other student-related records
        await tx.subjectAttendance.deleteMany({
          where: { studentId: existingUser.student.id }
        });
        
        await tx.assessmentMark.deleteMany({
          where: { studentId: existingUser.student.id }
        });
        
        await tx.gradeRecord.deleteMany({
          where: { studentId: existingUser.student.id }
        });
        
        await tx.registration.deleteMany({
          where: { studentId: existingUser.student.id }
        });
        
        await tx.attendance.deleteMany({
          where: { studentId: existingUser.student.id }
        });
        
        await tx.submission.deleteMany({
          where: { studentId: existingUser.student.id }
        });
        
        // Then delete the student record
        await tx.student.delete({
          where: { id: existingUser.student.id }
        });
      }
      
      if (existingUser.faculty) {
        // Unlink subjects from faculty
        await tx.subject.updateMany({
          where: { facultyId: existingUser.faculty.id },
          data: { facultyId: null }
        });
        
        // Delete faculty record
        await tx.faculty.delete({
          where: { id: existingUser.faculty.id }
        });
      }
      
      if (existingUser.admin) {
        // Reassign approvals to another admin if necessary
        if ('approval' in tx) {
          await tx.approval.deleteMany({
            where: { adminId: existingUser.admin.id }
          });
        }
        
        await tx.admin.delete({
          where: { id: existingUser.admin.id }
        });
      }
      
      // Important: Delete ALL approvals related to this user (both as admin and as subject)
      // This addresses the ApprovalToUser constraint violation
      await tx.approval.deleteMany({
        where: {
          OR: [
            { adminId: userId },
            { userId: userId }
          ]
        }
      });
      
      // Delete profile
      await tx.profile.deleteMany({
        where: { userId }
      });
      
      // Finally, delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });
    
    return NextResponse.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Failed to delete user:", error);
    return NextResponse.json(
      { message: "Failed to delete user", error: (error as any).message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}