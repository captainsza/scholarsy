import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Update faculty information
export async function PUT(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  try {
    // Get auth token and verify access
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    
    // Verify and decode token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    // Get faculty ID from route params
    const facultyId = params.facultyId;
    
    // Get faculty and their user ID
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: { user: true }
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }
    
    // Security check: only the faculty member themselves or an admin can update
    if (decoded.id !== faculty.userId && decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }
    
    // Get update data from request body
    const data = await req.json();
    
    // Extract fields to update
    const {
      department,
      specialization,
      qualification,
      experience,
      researchInterests,
      officeLocation,
      officeHours,
      user
    } = data;
    
    // Update faculty data in a transaction
    const updatedFaculty = await prisma.$transaction(async (tx) => {
      // Update faculty record
    const updatedFacultyData = await tx.faculty.update({
        where: { id: facultyId },
        data: {
            department,
        },
        include: {
            user: {
                include: {
                    profile: true
                }
            }
        }
    });
      
      // Update profile if provided
      if (user?.profile) {
        await tx.profile.update({
          where: { userId: faculty.userId },
          data: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            profileImage: user.profile.profileImage
          }
        });
      }
      
      // Only administrators can update these fields
      if (decoded.role === 'ADMIN' && user) {
        await tx.user.update({
          where: { id: faculty.userId },
          data: {
            email: user.email,
            isApproved: user.isApproved,
            emailVerified: user.emailVerified
          }
        });
      }
      
      // Fetch the updated faculty record with all relations
      return tx.faculty.findUnique({
        where: { id: facultyId },
        include: {
          user: {
            include: {
              profile: true
            }
          },
          subjects: true
        }
      });
    });
    
    return NextResponse.json({
      message: "Faculty updated successfully",
      faculty: updatedFaculty
    });
  } catch (error) {
    console.error("Failed to update faculty:", error);
    return NextResponse.json(
      { message: `Failed to update faculty: ${(error as any).message}` },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
