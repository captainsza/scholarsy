import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Function to get the authenticated user from a request
export async function getSessionUser(req: NextRequest) {
  try {
    // Use the existing session API endpoint
    const sessionRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/session`, {
      headers: {
        cookie: req.headers.get('cookie') || '',
      },
    });

    if (!sessionRes.ok) {
      console.error('Failed to get session:', sessionRes.status);
      return null;
    }

    const session = await sessionRes.json();
    return session.user || null;
  } catch (error) {
    console.error('Session fetch error:', error);
    return null;
  }
}

// Alternative: direct database access if you don't want to use the API call
export async function getUserFromCookie(req: NextRequest) {
  try {
    // Extract auth token from cookie
    const authToken = req.cookies.get('auth-token')?.value;
    
    if (!authToken) {
      return null;
    }
    
    // No need to decrypt/verify the token ourselves, just use it to find the user session
    const user = await prisma.user.findFirst({
      where: {
        // You would need some kind of sessions table or a way to map tokens to users
        // This is just a placeholder implementation
      },
      include: {
        profile: true,
        faculty: true,
        student: true,
        admin: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error getting user from cookie:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}
