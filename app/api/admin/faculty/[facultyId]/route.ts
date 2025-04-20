import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'ADMIN' && decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // If user is faculty, check if they're accessing their own record
    if (decoded.role === 'FACULTY') {
      const requestingFaculty = await prisma.faculty.findFirst({
        where: { userId: decoded.id },
      });
      
      if (!requestingFaculty || requestingFaculty.id !== params.facultyId) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }
    }
    
    // Fetch the faculty record with all relevant related data
    const faculty = await prisma.faculty.findUnique({
      where: { id: params.facultyId },
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
          include: {
            course: true,
          },
        },
        courses: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: {
                      include: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        workload: true,
        leaves: true,
        schedules: {
          include: {
            room: true,
          },
        },
      },
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }
    
    return NextResponse.json({ faculty });
  } catch (error: any) {
    console.error('Faculty fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty data' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
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
    
    const { department, ...userData } = await req.json();
    
    // Update the faculty department
    const updatedFaculty = await prisma.faculty.update({
      where: { id: params.facultyId },
      data: { department },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    // If user data was provided, update the related user profile
    if (userData && Object.keys(userData).length > 0) {
      // Extract profile data
      const { firstName, lastName, phone, profileImage } = userData;
      
      // Update the profile if any profile data was provided
      if (firstName || lastName || phone || profileImage) {
        const profileData: any = {};
        if (firstName !== undefined) profileData.firstName = firstName;
        if (lastName !== undefined) profileData.lastName = lastName;
        if (phone !== undefined) profileData.phone = phone;
        if (profileImage !== undefined) profileData.profileImage = profileImage;
        
        await prisma.profile.update({
          where: { userId: updatedFaculty.userId },
          data: profileData,
        });
      }
    }
    
    // Fetch the updated faculty record with the updated user profile
    const faculty = await prisma.faculty.findUnique({
      where: { id: params.facultyId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    return NextResponse.json({ faculty });
  } catch (error: any) {
    console.error('Faculty update error:', error);
    return NextResponse.json(
      { message: 'Failed to update faculty data' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
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
    
    // First fetch the faculty record to get the user ID
    const faculty = await prisma.faculty.findUnique({
      where: { id: params.facultyId },
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }
    
    // Delete the faculty record
    await prisma.faculty.delete({
      where: { id: params.facultyId },
    });
    
    return NextResponse.json({ message: 'Faculty deleted successfully' });
  } catch (error: any) {
    console.error('Faculty deletion error:', error);
    return NextResponse.json(
      { message: 'Failed to delete faculty' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
