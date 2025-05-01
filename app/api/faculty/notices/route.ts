import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get token from cookies
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }

    // Get the faculty details
    const faculty = await prisma.faculty.findFirst({
      where: { userId: decoded.id },
      include: { user: { include: { profile: true } } }
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }

    // Current date for filtering expired notices
    const currentDate = new Date();
    
    // Fetch notices targeted at:
    // 1. ALL users
    // 2. FACULTY role specifically
    // 3. Faculty's department
    const notices = await prisma.notice.findMany({
      where: {
        isPublished: true,
        AND: [
          {
            // Not expired or expiry date is null
            OR: [
              { expiryDate: null },
              { expiryDate: { gte: currentDate } }
            ]
          },
          {
            // Targeting conditions
            OR: [
              { targetType: 'ALL' },
              { 
                targetType: 'ROLE',
                targetUserRoles: { has: 'FACULTY' }
              },
              { 
                targetType: 'DEPARTMENT',
                targetDepartments: { has: faculty.department }
              }
            ]
          }
        ]
      },
      orderBy: [
        { isPinned: 'desc' },
        { publishDate: 'desc' }
      ]
    });

    // Parse attachment URLs if needed
    const processedNotices = notices.map(notice => ({
      ...notice,
      attachmentUrls: notice.attachmentUrls.map(url => {
        try {
          return JSON.parse(url as string);
        } catch (e) {
          return url;
        }
      })
    }));

    return NextResponse.json({ notices: processedNotices });
  } catch (error: any) {
    console.error('Error fetching faculty notices:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notices', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
