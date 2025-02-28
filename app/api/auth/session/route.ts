import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies - fix by awaiting cookies()
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Verify token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string };

    // Get user from database with proper relation includes
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
        faculty: true,
        student: true,
        admin: true,
      }
    });

    if (!user) {
      // Token valid but user not found
      cookieStore.delete('auth-token');
      return NextResponse.json({ user: null }, { status: 200 });
    }

    // Create a safe user object without the password
    const { password, ...safeUser } = user;

    return NextResponse.json({ user: safeUser });
  } catch (error) {
    // Invalid token
    const cookieStore = await cookies();
    cookieStore.delete('auth-token');
    return NextResponse.json({ user: null }, { status: 200 });
  } finally {
    await prisma.$disconnect();
  }
}
