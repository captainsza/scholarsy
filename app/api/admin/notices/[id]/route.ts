import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSessionUser } from '@/lib/session-utils';
import { sendEmail } from '@/utils/email';

const prisma = new PrismaClient();

// Helper function to get notice by ID
async function getNotice(id: string) {
  return prisma.notice.findUnique({
    where: { id }
  });
}

// GET: Get notice by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    const { id } = params;

    if (!user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notice = await getNotice(id);

    if (!notice) {
      return NextResponse.json(
        { message: 'Notice not found' },
        { status: 404 }
      );
    }

    // Record view (if not an admin)
    if (user.role !== 'ADMIN') {
      try {
        await prisma.noticeView.upsert({
          where: {
            noticeId_userId: {
              noticeId: id,
              userId: user.id
            }
          },
          update: {
            viewedAt: new Date()
          },
          create: {
            noticeId: id,
            userId: user.id
          }
        });
      } catch (error) {
        console.error('Failed to record view:', error);
        // Continue anyway, this isn't critical
      }
    }

    // Get view count
    const viewCount = await prisma.noticeView.count({
      where: { noticeId: id }
    });

    return NextResponse.json({ notice: { ...notice, viewCount } });
  } catch (error) {
    console.error('Failed to fetch notice:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notice' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Update notice
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    const { id } = params;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notice = await getNotice(id);

    if (!notice) {
      return NextResponse.json(
        { message: 'Notice not found' },
        { status: 404 }
      );
    }

    const data = await req.json();
    
    // Handle target fields based on target type
    const { targetType, targetUserRoles, targetDepartments, targetCourseIds, targetSectionIds, sendEmail: shouldSendEmail, ...noticeData } = data;

    // Update the notice
    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: {
        ...noticeData,
        targetType,
        targetUserRoles: targetType === 'ROLE' || targetType === 'CUSTOM' ? targetUserRoles || [] : [],
        targetDepartments: targetType === 'DEPARTMENT' || targetType === 'CUSTOM' ? targetDepartments || [] : [],
        targetCourseIds: targetType === 'COURSE' || targetType === 'CUSTOM' ? targetCourseIds || [] : [],
        targetSectionIds: targetType === 'SECTION' || targetType === 'CUSTOM' ? targetSectionIds || [] : [],
      },
    });

    // Send email notifications if requested
    if (shouldSendEmail) {
      try {
        // Import sendNoticeEmails function from the parent module
        const { default: noticesRouteModule } = await import('../route');
        // @ts-ignore - Access the exported function
        await noticesRouteModule.sendNoticeEmails(updatedNotice);
      } catch (error) {
        console.error('Failed to send email notifications:', error);
      }
    }

    // Get view count
    const viewCount = await prisma.noticeView.count({
      where: { noticeId: id }
    });

    return NextResponse.json({ notice: { ...updatedNotice, viewCount } });
  } catch (error) {
    console.error('Failed to update notice:', error);
    return NextResponse.json(
      { message: 'Failed to update notice' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Delete notice
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getSessionUser(req);
    const { id } = params;

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const notice = await getNotice(id);

    if (!notice) {
      return NextResponse.json(
        { message: 'Notice not found' },
        { status: 404 }
      );
    }

    // Delete all associated views first (foreign key constraint)
    await prisma.noticeView.deleteMany({
      where: { noticeId: id }
    });

    // Delete the notice
    await prisma.notice.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Notice deleted successfully' });
  } catch (error) {
    console.error('Failed to delete notice:', error);
    return NextResponse.json(
      { message: 'Failed to delete notice' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}