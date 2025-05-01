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
    
    if (!['ADMIN', 'FACULTY'].includes(decoded.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get all rooms
    const rooms = await prisma.room.findMany({
      orderBy: { name: 'asc' }
    });
    
    return NextResponse.json({ rooms });
  } catch (error: any) {
    console.error('Rooms fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch rooms', error: error.message }, 
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
    
    // Get room data from request
    const { name, type, capacity } = await req.json();
    
    if (!name || !capacity) {
      return NextResponse.json(
        { message: 'Name and capacity are required' }, 
        { status: 400 }
      );
    }
    
    // Check if room with same name already exists
    const existingRoom = await prisma.room.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    });
    
    if (existingRoom) {
      return NextResponse.json(
        { message: 'Room with this name already exists' }, 
        { status: 409 }
      );
    }
    
    // Create new room
    const room = await prisma.room.create({
      data: {
        name,
        type: type || 'CLASSROOM',
        capacity: Number(capacity)
      }
    });
    
    return NextResponse.json({ room }, { status: 201 });
  } catch (error: any) {
    console.error('Room creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create room', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
