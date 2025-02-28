import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');
    
    if (!token) {
      return NextResponse.json({ valid: false, message: 'Token is required' }, { status: 400 });
    }

    // Find the reset token
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        token,
        expires: {
          gt: new Date(),
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json({ valid: false, message: 'Invalid or expired token' }, { status: 400 });
    }

    return NextResponse.json({ valid: true, message: 'Token is valid' });
  } catch (error: any) {
    console.error('Token verification error:', error);
    return NextResponse.json(
      { valid: false, message: 'Failed to verify token' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
