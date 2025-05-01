import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSessionUser } from '@/lib/session-utils';
import { sendEmail } from '@/utils/email';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { uploadFileToCloudinary } from '@/utils/cloudinary';

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
    const { id } = params;

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

    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    // Get the request body
    const data = await req.json();
    const { 
      title, 
      content, 
      publishDate, 
      expiryDate, 
      isPublished, 
      isPinned,
      targetType,
      targetCourseIds, 
      targetDepartments, 
      targetUserRoles, 
      newAttachments, // Array of {data: Base64String, type: MimeType, name: FileName}
      keepAttachments, // Array of URLs to keep
      linkUrl
    } = data;

    // Get original notice to check for existing attachments
    const originalNotice = await prisma.notice.findUnique({
      where: { id },
    });

    if (!originalNotice) {
      return NextResponse.json({ message: 'Notice not found' }, { status: 404 });
    }

    // Process attachments
    // 1. Keep attachments that user wants to retain
    const existingAttachments = originalNotice.attachmentUrls.map(att => {
      try {
        return JSON.parse(att as string);
      } catch {
        return { url: att, name: 'Unknown', type: 'unknown' };
      }
    });

    const attachmentsToKeep = keepAttachments
      ? existingAttachments.filter(att => 
          keepAttachments.includes(att.url)
        )
      : [];

    // 2. Upload new attachments
    let newUploadedAttachments: { url: string, name: string, type: string }[] = [];

    if (newAttachments && Array.isArray(newAttachments) && newAttachments.length > 0) {
      // Upload each new attachment to Cloudinary
      const uploadPromises = newAttachments.map(async (attachment) => {
        try {
          const result = await uploadFileToCloudinary(
            attachment.data, 
            attachment.type,
            { 
              folder: 'scholarsync/notice_attachments',
              originalFilename: attachment.name 
            }
          );

          return { 
            url: result.url, 
            name: attachment.name, 
            type: attachment.type 
          };
        } catch (error) {
          console.error('Error uploading new attachment:', error);
          return null;
        }
      });

      const uploadResults = await Promise.all(uploadPromises);
      newUploadedAttachments = uploadResults.filter(Boolean) as { url: string, name: string, type: string }[];
    }

    // Combine kept and new attachments
    const finalAttachments = [...attachmentsToKeep, ...newUploadedAttachments];

    // Update the notice
    const updatedNotice = await prisma.notice.update({
      where: { id },
      data: {
        title,
        content,
        publishDate: publishDate ? new Date(publishDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isPublished: isPublished !== undefined ? isPublished : undefined,
        isPinned: isPinned !== undefined ? isPinned : undefined,
        targetType: targetType || undefined,
        targetCourseIds: targetCourseIds || undefined,
        targetDepartments: targetDepartments || undefined,
        targetUserRoles: targetUserRoles || undefined,
        linkUrl: linkUrl || null,
        attachmentUrls: finalAttachments.map(att => JSON.stringify(att)),
        updatedAt: new Date()
      },
    });

    return NextResponse.json({ 
      message: 'Notice updated successfully', 
      notice: updatedNotice,
      attachments: finalAttachments
    });

  } catch (error: any) {
    console.error('Update notice error:', error);
    return NextResponse.json(
      { message: 'Failed to update notice', error: error.message }, 
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