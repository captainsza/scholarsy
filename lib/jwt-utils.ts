import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Function to directly verify and decode a JWT token
export const verifyAuthToken = (token: string | undefined) => {
  if (!token) return null;
  
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as {
      id: string;
      email: string;
      role: string;
    };
  } catch (error) {
    console.error('JWT verification error:', error);
    return null;
  }
};

// Function to get user from auth token
export async function getUserFromToken(req: NextRequest) {
  try {
    // Extract auth token from cookie
    const token = req.cookies.get('auth-token')?.value;
    
    if (!token) {
      return null;
    }
    
    // Verify and decode the token
    const decoded = verifyAuthToken(token);
    if (!decoded || !decoded.id) {
      return null;
    }
    
    // Fetch user from database using the decoded ID
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        profile: true,
        faculty: true,
        student: true,
        admin: true
      }
    });
    
    return user;
  } catch (error) {
    console.error('Error getting user from token:', error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}
