import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Role } from '@prisma/client';
import { sendApprovalEmail } from '@/utils/email';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

// Get approvals
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const roleParam = searchParams.get('role');
    const role = roleParam as Role | undefined;
    
    // Fetch users that require approval (emailVerified but not approved)
    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
        isApproved: false,
        ...(role ? { role } : {}), // Filter by role if provided
      },
      include: {
        profile: true,
        student: true,
        faculty: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    
    // Transform user data for the frontend
    const approvals = users.map(user => ({
      id: user.id, // This is the approval ID
      userId: user.id,
      userEmail: user.email,
      userName: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
      role: user.role,
      department: user.student?.department || user.faculty?.department || '',
      enrollmentId: user.student?.enrollmentId || undefined,
      createdAt: user.createdAt.toISOString(),
    }));
    
    return NextResponse.json({ approvals });
  } catch (error: any) {
    console.error('Approval fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch approvals' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Process approval (approve/reject)
export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json();
    
    if (!userId || !['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { message: 'Invalid request parameters' }, 
        { status: 400 }
      );
    }
    
    // Get current admin user from JWT token in cookie
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { message: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get the admin record for the current user
    const admin = await prisma.admin.findUnique({
      where: { userId: decoded.id },
    });
    
    if (!admin) {
      return NextResponse.json(
        { message: 'Admin record not found' },
        { status: 404 }
      );
    }
    
    // Update user approval status
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        isApproved: action === 'approve',
      },
      include: {
        profile: true,
      },
    });
    
    // Create approval record
    await prisma.approval.create({
      data: {
        userId,
        adminId: admin.id,  // Using the actual admin ID from the database
        status: action === 'approve' ? 'APPROVED' : 'REJECTED',
      },
    });
    
    // Send email notification to user
    await sendApprovalEmail(user.email, action === 'approve');
    
    return NextResponse.json({ 
      message: `User ${action === 'approve' ? 'approved' : 'rejected'} successfully` 
    });
  } catch (error: any) {
    console.error('Approval process error:', error);
    return NextResponse.json(
      { message: 'Failed to process approval request' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
