import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

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
    
    // Get student count
    const studentCount = await prisma.student.count();
    
    // Get faculty count
    const facultyCount = await prisma.faculty.count();
    
    // Get pending approvals count
    const pendingApprovalsCount = await prisma.user.count({
      where: {
        isApproved: false,
        emailVerified: true, // Only count email verified users
      },
    });
    
    // Get course count
    const courseCount = await prisma.course.count();
    
    // Get student distribution by department
    const studentsByDepartment = await getDistributionByDepartment('student');
    
    // Get faculty distribution by department
    const facultyByDepartment = await getDistributionByDepartment('faculty');
    
    // Get recent activities
    const recentActivities = await getRecentActivities();
    
    return NextResponse.json({
      totalStudents: studentCount,
      totalFaculty: facultyCount,
      pendingApprovals: pendingApprovalsCount,
      totalCourses: courseCount,
      studentsByDepartment,
      facultyByDepartment,
      recentActivity: recentActivities,
    });
  } catch (error: any) {
    console.error('Dashboard data fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch dashboard data' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to get distribution by department
async function getDistributionByDepartment(type: 'student' | 'faculty') {
  let records;
  
  if (type === 'student') {
    records = await prisma.student.groupBy({
      by: ['department'],
      _count: {
        id: true,
      },
    });
  } else {
    records = await prisma.faculty.groupBy({
      by: ['department'],
      _count: {
        id: true,
      },
    });
  }
  
  // Convert to format: { department: count }
  return records.reduce((acc, curr) => {
    acc[curr.department] = curr._count.id;
    return acc;
  }, {} as Record<string, number>);
}

// Helper function to get recent activities
async function getRecentActivities() {
  // In a real app, you would have an Activity model to track these
  // For demo purposes, we'll create mock data
  
  // Get recent user registrations
  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      profile: true,
    },
  });
  
  // Create activities from users
  const userActivities = recentUsers.map(user => ({
    id: user.id,
    type: 'registration',
    user: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
    action: `registered as a new ${user.role.toLowerCase()}`,
    timestamp: user.createdAt.toISOString(),
  }));
  
  // Get recent approvals
  const recentApprovals = await prisma.approval.findMany({
    take: 5,
    where: {
      status: 'APPROVED',
    },
    orderBy: {
      updatedAt: 'desc',
    },
    include: {
      user: {
        include: {
          profile: true,
        },
      },
      admin: {
        include: {
          user: {
            include: {
              profile: true,
            },
          },
        },
      },
    },
  });
  
  // Create activities from approvals
  const approvalActivities = recentApprovals.map(approval => ({
    id: approval.id,
    type: 'approval',
    user: approval.admin.user.profile 
      ? `${approval.admin.user.profile.firstName} ${approval.admin.user.profile.lastName}`
      : approval.admin.user.email,
    action: `approved user ${approval.user.profile 
      ? `${approval.user.profile.firstName} ${approval.user.profile.lastName}` 
      : approval.user.email}`,
    timestamp: approval.updatedAt.toISOString(),
  }));
  
  // Combine and sort activities
  return [...userActivities, ...approvalActivities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10); // Take the 10 most recent activities
}
