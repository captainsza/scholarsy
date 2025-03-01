import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/utils/email';
import { v2 as cloudinary } from 'cloudinary';
import { uploadToCloudinary } from '@/utils/cloudinary';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { 
      // Basic auth info
      email, password, role, 
      
      // Profile info
      firstName, lastName, phone, department,
      profileImageBase64, // Add this line
      
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
    
    // Upload profile image if provided
    let profileImageUrl: string | undefined = undefined;
    if (profileImageBase64) {
      try {
        // Don't call uploadToCloudinary - instead, upload directly here:
        const result = await cloudinary.uploader.upload(profileImageBase64, {
          transformation: [
            { width: 400, height: 400, crop: 'limit' }
          ]
        });
        profileImageUrl = result.secure_url;
      } catch (error) {
        console.error('Failed to upload profile image:', error);
        // Continue with registration even if image upload fails
      }
    }
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // Token valid for 24 hours
    
    // Begin transaction to create user and related data
    const user = await prisma.$transaction(async (prisma: {
        user: { create: (arg0: { data: { email: any; password: string; role: any; emailVerified: boolean; isApproved: boolean; }; }) => any; }; profile: {
          create: (arg0: {
            data: {
              firstName: any; lastName: any; phone: any; profileImage: string | undefined; // Add this line
              userId: any;
            };
          }) => any;
        }; student: {
          create: (arg0: {
            data: {
              userId: any; department: any; enrollmentId: any;
              // Add enhanced student fields
              gender: any; dob: Date | undefined; bloodGroup: any; fatherName: any; motherName: any; admissionSession: any; admissionSemester: any; academicStatus: any; instituteCode: any; instituteName: any; courseName: any; branchName: any; currentSemester: any; address: any; city: any; state: any; country: any; pincode: any;
            };
          }) => any;
        }; faculty: { create: (arg0: { data: { userId: any; department: any; }; }) => any; }; admin: { create: (arg0: { data: { userId: any; }; }) => any; }; verificationToken: { create: (arg0: { data: { identifier: any; token: string; expires: Date; }; }) => any; };
      }) => {
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

      // Create profile with image URL if available
      await prisma.profile.create({
        data: {
          firstName,
          lastName,
          phone,
          profileImage: profileImageUrl, // Add this line
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
