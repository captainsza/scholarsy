import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSessionUser } from '@/lib/session-utils';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get the current user from session
    const user = await getSessionUser(req);
    
    if (!user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Verify user is a student
    if (user.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Student access required' }, { status: 403 });
    }
    
    // Get student record
    const student = await prisma.student.findFirst({
      where: { userId: user.id },
      include: {
        registrations: {
          select: { courseId: true }
        },
        sectionEnrollments: {
          select: { sectionId: true }
        }
      }
    });
    
    if (!student) {
      return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
    }

    const now = new Date();
    
    // Build query to find notices targeted to this student
    const courseIds = student.registrations.map(reg => reg.courseId);
    const sectionIds = student.sectionEnrollments.map(enroll => enroll.sectionId);
    
    // Find the student's department
    const studentDepartment = student.department;

    // Query notices
    const notices = await prisma.notice.findMany({
      where: {
        AND: [
          { isPublished: true },
          {
            OR: [
              // General notices for everyone
              { targetType: 'ALL' },
              
              // Notices for students
              {
                AND: [
                  { targetType: 'ROLE' },
                  { targetUserRoles: { has: 'STUDENT' } }
                ]
              },
              
              // Notices for student's department
              {
                AND: [
                  { targetType: 'DEPARTMENT' },
                  { targetDepartments: { has: studentDepartment } }
                ]
              },
              
              // Notices for student's courses
              {
                AND: [
                  { targetType: 'COURSE' },
                  { targetCourseIds: { hasSome: courseIds } }
                ]
              },
              
              // Notices for student's sections
              {
                AND: [
                  { targetType: 'SECTION' },
                  { targetSectionIds: { hasSome: sectionIds } }
                ]
              },
              
              // Custom targeting
              {
                AND: [
                  { targetType: 'CUSTOM' },
                  {
                    OR: [
                      { targetUserRoles: { has: 'STUDENT' } },
                      { targetDepartments: { has: studentDepartment } },
                      { targetCourseIds: { hasSome: courseIds } },
                      { targetSectionIds: { hasSome: sectionIds } }
                    ]
                  }
                ]
              }
            ]
          },
          // Check if notice is not expired
          {
            OR: [
              { expiryDate: null },
              { expiryDate: { gt: now } }
            ]
          },
          // Check if notice publish date is in the past
          { publishDate: { lte: now } }
        ]
      },
      orderBy: [
        { isPinned: 'desc' },
        { publishDate: 'desc' }
      ]
    });

    // Track that student has viewed these notices
    await Promise.all(
      notices.map(async (notice) => {
        try {
          await prisma.noticeView.upsert({
            where: {
              noticeId_userId: {
                noticeId: notice.id,
                userId: user.id
              }
            },
            update: {
              viewedAt: new Date()
            },
            create: {
              noticeId: notice.id,
              userId: user.id,
              viewedAt: new Date()
            }
          });
        } catch (error) {
          console.error(`Failed to record view for notice ${notice.id}:`, error);
          // Continue anyway, view tracking isn't critical
        }
      })
    );

    return NextResponse.json({ notices });
  } catch (error: any) {
    console.error('Student notices fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch notices', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}