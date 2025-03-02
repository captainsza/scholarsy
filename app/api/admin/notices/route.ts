import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSessionUser } from '@/lib/session-utils';
import { sendEmail } from '@/utils/email';

const prisma = new PrismaClient();

// GET: Fetch all notices
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Query params
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined;
    const target = searchParams.get('target');
    const type = searchParams.get('type');

    // Build the query
    const query: any = {};

    if (target) {
      // Handle targeting queries
      if (target === 'published') {
        query.isPublished = true;
      } else if (target === 'pinned') {
        query.isPinned = true;
      } else if (target === 'expired') {
        query.expiryDate = { lt: new Date() };
      } else if (target === 'upcoming') {
        query.publishDate = { gt: new Date() };
      }
    }

    if (type) {
      query.targetType = type;
    }

    // Calculate pagination
    const skip = page && limit ? (page - 1) * limit : undefined;

    // Execute query
    const notices = await prisma.notice.findMany({
      where: query,
      orderBy: [
        { isPinned: 'desc' },
        { publishDate: 'desc' }
      ],
      take: limit,
      skip,
    });

    // Count total for pagination
    const total = await prisma.notice.count({ where: query });

    // Add view counts to each notice
    const noticesWithViewCount = await Promise.all(
      notices.map(async (notice: { id: any; }) => {
        const viewCount = await prisma.noticeView.count({
          where: { noticeId: notice.id },
        });
        return { ...notice, viewCount };
      })
    );

    return NextResponse.json({
      notices: noticesWithViewCount,
      pagination: {
        total,
        page: page || 1,
        limit: limit || total,
      },
    });
  } catch (error) {
    console.error('Failed to fetch notices:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notices' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create new notice
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req);

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await req.json();
    
    // Required fields validation
    if (!data.title || !data.content || !data.targetType) {
      return NextResponse.json(
        { message: 'Title, content, and target type are required' },
        { status: 400 }
      );
    }

    // Handle target fields based on target type
    const { targetType, targetUserRoles, targetDepartments, targetCourseIds, targetSectionIds, sendEmail: shouldSendEmail, ...noticeData } = data;

    // Create the notice
    const notice = await prisma.notice.create({
      data: {
        ...noticeData,
        targetType,
        targetUserRoles: targetType === 'ROLE' || targetType === 'CUSTOM' ? targetUserRoles || [] : [],
        targetDepartments: targetType === 'DEPARTMENT' || targetType === 'CUSTOM' ? targetDepartments || [] : [],
        targetCourseIds: targetType === 'COURSE' || targetType === 'CUSTOM' ? targetCourseIds || [] : [],
        targetSectionIds: targetType === 'SECTION' || targetType === 'CUSTOM' ? targetSectionIds || [] : [],
        authorId: user.id,
        authorRole: user.role,
        authorName: `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.trim() || user.email
      },
    });

    // Handle email notifications if requested
    if (shouldSendEmail) {
      await sendNoticeEmails(notice);
    }

    return NextResponse.json({ notice }, { status: 201 });
  } catch (error) {
    console.error('Failed to create notice:', error);
    return NextResponse.json(
      { message: 'Failed to create notice' },
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
