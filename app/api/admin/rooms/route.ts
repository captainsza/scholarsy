import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Verify authentication
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    
    // Get rooms
    const rooms = await prisma.room.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('Rooms fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch rooms' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify authentication
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    
    // Parse request body
    const { name, type, capacity } = await req.json();
    
    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { message: 'Name and type are required' }, 
        { status: 400 }
      );
    }
    
    // Create room
    const room = await prisma.room.create({
      data: {
        name,
        type,
        capacity: capacity || 30, // Default capacity if not provided
      }
    });
    
    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    console.error('Room creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create room' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
