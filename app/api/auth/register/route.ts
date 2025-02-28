import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/utils/email';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      // Basic auth info
      email, password, role, 
      
      // Profile info
      firstName, lastName, phone, department,
      
      // Student-specific information
      enrollmentId,
      gender,
      dob,
      bloodGroup,
      fatherName,
      motherName,
      admissionSession,
      admissionSemester,
      academicStatus,
      instituteCode,
      instituteName,
      courseName,
      branchName,
      currentSemester,
      address,
      city,
      state,
      country,
      pincode
    } = data;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });
    
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' }, 
        { status: 400 }
      );
    }
    
    // If student role, check if enrollment ID already exists
    if (role === 'STUDENT' && enrollmentId) {
      const existingStudent = await prisma.student.findUnique({
        where: { enrollmentId },
      });
      
      if (existingStudent) {
        return NextResponse.json(
          { message: 'Student with this enrollment ID already exists' }, 
          { status: 400 }
        );
      }
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours
    
    // Begin transaction to create user and related data
    const user = await prisma.$transaction(async (prisma) => {
      // Create the user
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          role: role,
          emailVerified: false,
          isApproved: role === 'ADMIN', // Auto-approve admin users
        },
      });

      // Create profile
      await prisma.profile.create({
        data: {
          firstName,
          lastName,
          phone,
          userId: user.id,
        },
      });

      // Create role-specific record
      if (role === 'STUDENT') {
        // Parse date of birth if provided
        const parsedDob = dob ? new Date(dob) : undefined;
        
        await prisma.student.create({
          data: {
            userId: user.id,
            department,
            enrollmentId,
            // Add enhanced student fields
            gender,
            dob: parsedDob,
            bloodGroup,
            fatherName,
            motherName,
            admissionSession,
            admissionSemester,
            academicStatus,
            instituteCode,
            instituteName,
            courseName,
            branchName,
            currentSemester,
            address,
            city,
            state,
            country,
            pincode
          },
        });
      } else if (role === 'FACULTY') {
        await prisma.faculty.create({
          data: {
            userId: user.id,
            department,
          },
        });
      } else if (role === 'ADMIN') {
        await prisma.admin.create({
          data: {
            userId: user.id,
          },
        });
      }
      
      // Create verification token
      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token: verificationToken,
          expires: tokenExpiry,
        },
      });

      return user;
    });
    
    // Send verification email
    await sendVerificationEmail(email, verificationToken);
    
    // Return success response (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    return NextResponse.json(
      { message: 'Registration successful. Please verify your email.', user: userWithoutPassword }, 
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: error.message || 'Registration failed' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
