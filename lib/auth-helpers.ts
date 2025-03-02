import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { AuthUser } from '@/types';

const prisma = new PrismaClient();

// Get JWT secret with fallback for development
const JWT_SECRET = process.env.JWT_SECRET || 'scholarsync-development-secret-key';

// Function to get the current user from a cookie
export async function getCurrentUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    // Get token from cookie
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify the JWT token with better error handling
    let decoded: { id: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch (jwtError) {
      console.error('JWT verification failed:', jwtError);
      return null;
    }
    
    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
        faculty: true,
        student: true,
        admin: true
      }
    });
    
    if (!user) {
      return null;
    }
    
    // Return user without password
    const { password, ...safeUser } = user;
    return safeUser as unknown as AuthUser;
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

// Function to validate user has required role
export function validateUserRole(
  user: AuthUser | null, 
  requiredRole: 'ADMIN' | 'FACULTY' | 'STUDENT'
): boolean {
  return !!user && user.role === requiredRole;
}
