import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { sendVerificationEmail } from '@/utils/email';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { message: 'Email address is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // For security, don't reveal if email exists
      return NextResponse.json({
        success: true,
        message: 'If an account with this email exists, a verification link has been sent.'
      });
    }

    // Check if already verified
    if (user.emailVerified) {
      return NextResponse.json({
        success: true,
        message: 'This email is already verified. You can log in now.'
      });
    }

    // Delete any existing tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { identifier: email },
    });

    // Generate new token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 24); // 24 hours

    // Save token
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token: verificationToken,
        expires: tokenExpiry,
      },
    });

    try {
      // Send verification email
      await sendVerificationEmail(email, verificationToken);
      console.log(`Verification email sent to ${email}`);
    } catch (emailError) {
      // Log error but don't fail the request since we're showing the token in development
      console.error('Failed to send verification email:', emailError);
      
      // In development mode, return the verification token for testing
      if (process.env.NODE_ENV !== 'production') {
        return NextResponse.json({
          success: true,
          message: 'Verification initiated. In development mode, use this link:',
          verificationUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}`
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email has been sent. Please check your inbox.',
    });
  } catch (error: any) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to resend verification email' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
