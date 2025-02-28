import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
        faculty: true,
        student: true,
        admin: true,
      },
    });
    
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    
    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    
    if (!passwordMatch) {
      return NextResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }

    // Check email verification
    if (!user.emailVerified) {
      return NextResponse.json({ 
        message: 'Please verify your email before logging in',
        emailVerified: false 
      }, { status: 403 });
    }

    // Check if user is approved (for non-admin users)
    if (!user.isApproved && user.role !== 'ADMIN') {
      return NextResponse.json({
        message: 'Your account is pending approval',
        isApproved: false
      }, { status: 403 });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '8h' }
    );

    // Set cookie with the token
    (await
          // Set cookie with the token
          cookies()).set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60, // 8 hours
    });

    // Remove password from user object before sending response
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({
      user: userWithoutPassword,
      message: 'Login successful',
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ message: error.message || 'Login failed' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}