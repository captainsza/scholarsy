import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Get the user from the JWT token in cookies
async function getUserFromToken(req: NextRequest) {
  const cookieStore = cookies();
  const token = (await cookieStore).get('auth-token')?.value;

  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as { id: string };
    return decoded.id;
  } catch (error) {
    console.error('Invalid token:', error);
    return null;
  }
}

// Handle GET request to fetch the user profile
export async function GET(req: NextRequest) {
  try {
    const userId = await getUserFromToken(req);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        faculty: true,
        student: true,
        admin: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Don't send the password in the response
    const { password, ...userWithoutPassword } = user;
    return NextResponse.json(userWithoutPassword);

  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to fetch profile' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Handle PUT request to update the user profile
export async function PUT(req: NextRequest) {
  try {
    const userId = await getUserFromToken(req);

    if (!userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    // Get user to check role
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Begin transaction for updating user data
    const updatedUser = await prisma.$transaction(async (prisma) => {
      // Update profile if provided
      if (data.profile) {
        await prisma.profile.update({
          where: { userId },
          data: data.profile,
        });
      }

      // Update faculty data if user is a faculty
      if (user.role === 'FACULTY' && data.faculty) {
        await prisma.faculty.update({
          where: { userId },
          data: data.faculty,
        });
      }

      // Update student data if user is a student
      if (user.role === 'STUDENT' && data.student) {
        // Process date fields before sending to Prisma
        const studentData = { ...data.student };
        
        // Clean date fields - ensure empty string dates are converted to null or removed
        if (studentData.dob !== undefined) {
          if (studentData.dob === "" || studentData.dob === null) {
            // Remove the dob field if it's empty
            delete studentData.dob;
          } else if (typeof studentData.dob === 'string' && studentData.dob.trim().length > 0) {
            // Convert valid date string to Date object
            try {
              studentData.dob = new Date(studentData.dob);
              // Check if the date is valid
              if (isNaN(studentData.dob.getTime())) {
                delete studentData.dob;
              }
            } catch (error) {
              console.error('Invalid date format:', error);
              // Remove invalid date
              delete studentData.dob;
            }
          }
        }
        
        await prisma.student.update({
          where: { userId },
          data: studentData,
        });
      }

      // Return the updated user with related data
      return prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          faculty: user.role === 'FACULTY',
          student: user.role === 'STUDENT',
          admin: user.role === 'ADMIN',
        },
      });
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: 'Failed to update profile' },
        { status: 500 }
      );
    }

    // Don't send the password in the response
    const { password, ...userWithoutPassword } = updatedUser;
    
    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithoutPassword
    });

  } catch (error: any) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { message: error.message || 'Failed to update profile' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
