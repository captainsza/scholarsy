import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { uploadFileToCloudinary } from '@/utils/cloudinary';

const prisma = new PrismaClient();

// GET notices with filters
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
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }

    // Get search filters from query params
    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    
    // Build the where clause for Prisma query
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }
    
    if (status) {
      switch (status) {
        case 'published':
          where.isPublished = true;
          break;
        case 'draft':
          where.isPublished = false;
          break;
        case 'pinned':
          where.isPinned = true;
          break;
        case 'expired':
          where.expiryDate = { lt: new Date() };
          break;
      }
    }

    // Fetch notices
    const notices = await prisma.notice.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' }, // Pinned notices first
        { publishDate: 'desc' }, // Most recent first
      ],
    });

    return NextResponse.json({ notices });
  } catch (error: any) {
    console.error('Get notices error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notices', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST new notice
export async function POST(req: NextRequest) {
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
      linkUrl
    } = data;

    // Get user info for author details
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { profile: true },
    });
    
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    // Process attachments if any
    let attachmentUrls: { url: string, name: string, type: string }[] = [];
    
    if (newAttachments && Array.isArray(newAttachments) && newAttachments.length > 0) {
      // Upload each attachment to Cloudinary
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
          console.error('Error uploading attachment:', error);
          return null;
        }
      });
      
      const uploadResults = await Promise.all(uploadPromises);
      attachmentUrls = uploadResults.filter(Boolean) as { url: string, name: string, type: string }[];
    }

    // Create the notice
    const notice = await prisma.notice.create({
      data: {
        title,
        content,
        publishDate: publishDate ? new Date(publishDate) : new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        isPublished: isPublished !== undefined ? isPublished : true,
        isPinned: isPinned || false,
        targetType: targetType || 'ALL',
        targetCourseIds: targetCourseIds || [],
        targetDepartments: targetDepartments || [],
        targetUserRoles: targetUserRoles || [],
        authorId: user.id,
        authorRole: user.role,
        authorName: user.profile ? 
          `${user.profile.firstName} ${user.profile.lastName}` : 
          user.email,
        attachmentUrls: attachmentUrls.map(att => JSON.stringify(att)),
        linkUrl: linkUrl || null,
      },
    });
    
    // Send email notifications if the notice is published
    let emailsSent = false;
    if (notice.isPublished) {
      emailsSent = await sendNoticeEmails(notice);
    }

    return NextResponse.json({ 
      message: 'Notice created successfully', 
      notice,
      attachments: attachmentUrls,
      emailsSent
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Create notice error:', error);
    return NextResponse.json(
      { message: 'Failed to create notice', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to send emails based on notice targeting
async function sendNoticeEmails(notice: any) {
  try {
    // Build query to find recipients based on targeting
    let whereClause: any = {};
    
    switch (notice.targetType) {
      case 'ALL':
        // No filters needed
        break;
      case 'ROLE':
        whereClause.role = { in: notice.targetUserRoles };
        break;
      case 'DEPARTMENT':
        whereClause.OR = [
          { faculty: { department: { in: notice.targetDepartments } } },
          { student: { department: { in: notice.targetDepartments } } }
        ];
        break;
      case 'COURSE':
        whereClause.student = {
          registrations: {
            some: {
              courseId: { in: notice.targetCourseIds }
            }
          }
        };
        break;
      case 'SECTION':
        whereClause.student = {
          sectionEnrollments: {
            some: {
              sectionId: { in: notice.targetSectionIds }
            }
          }
        };
        break;
      case 'CUSTOM':
        const conditions = [];
        
        if (notice.targetUserRoles?.length > 0) {
          conditions.push({ role: { in: notice.targetUserRoles } });
        }
        
        if (notice.targetDepartments?.length > 0) {
          conditions.push({
            OR: [
              { faculty: { department: { in: notice.targetDepartments } } },
              { student: { department: { in: notice.targetDepartments } } }
            ]
          });
        }
        
        if (notice.targetCourseIds?.length > 0) {
          conditions.push({
            student: {
              registrations: {
                some: {
                  courseId: { in: notice.targetCourseIds }
                }
              }
            }
          });
        }
        
        if (notice.targetSectionIds?.length > 0) {
          conditions.push({
            student: {
              sectionEnrollments: {
                some: {
                  sectionId: { in: notice.targetSectionIds }
                }
              }
            }
          });
        }
        
        if (conditions.length > 0) {
          whereClause.OR = conditions;
        }
        break;
    }

    // Find all users that match the targeting criteria
    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: {
        email: true,
        profile: {
          select: {
            firstName: true
          }
        }
      }
    });

    // Send emails to all recipients
    for (const recipient of recipients) {
      await sendEmail({
        to: recipient.email,
        subject: `[ScholarSync] ${notice.title}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>${notice.title}</h2>
            <p>Dear ${recipient.profile?.firstName || 'User'},</p>
            <div style="margin: 20px 0;">
              ${notice.content}
            </div>
            ${notice.linkUrl ? `<p>Resource link: <a href="${notice.linkUrl}">${notice.linkUrl}</a></p>` : ''}
            <p>This notice was published on ${new Date(notice.publishDate).toLocaleDateString()}</p>
            ${notice.expiryDate ? `<p>This notice will expire on ${new Date(notice.expiryDate).toLocaleDateString()}</p>` : ''}
            <hr style="margin: 20px 0;" />
            <p style="color: #666; font-size: 12px;">This is an automated message from ScholarSync.</p>
          </div>
        `
      });
    }

    console.log(`Email notifications sent to ${recipients.length} recipients`);
    return true;
  } catch (error) {
    console.error('Failed to send notice emails:', error);
    return false;
  }
}
