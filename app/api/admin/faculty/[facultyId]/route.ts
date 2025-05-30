import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  try {
    const facultyId = params.facultyId;
    
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
    
    if (decoded.role !== 'ADMIN' && decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Access denied' }, { status: 403 });
    }

    // If user is faculty, check if they're accessing their own record
    if (decoded.role === 'FACULTY') {
      const requestingFaculty = await prisma.faculty.findFirst({
        where: { userId: decoded.id },
      });
      
      if (!requestingFaculty || requestingFaculty.id !== facultyId) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }
    }
    
    // Fetch the faculty record with all relevant related data
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isApproved: true,
            emailVerified: true,
            createdAt: true,
            profile: true,
          },
        },
        subjects: {
          include: {
            course: {
              select: {
                id: true,
                name: true,
                branch: true,
                year: true,
                semester: true,
                _count: {
                  select: {
                    enrollments: true
                  }
                }
              }
            },
            assessments: {
              select: {
                id: true,
                title: true,
                type: true,
                dueDate: true,
                maxMarks: true
              }
            },
            _count: {
              select: {
                attendances: true,
                assessments: true
              }
            }
          },
        },
        courses: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: {
                      include: {
                        profile: true,
                      },
                    },
                  },
                },
              },
            },
            subjects: {
              select: {
                id: true,
                name: true,
                code: true,
                creditHours: true
              }
            },
            _count: {
              select: {
                enrollments: true,
                subjects: true
              }
            }
          },
        },
        workload: true,
        leaves: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 5
        },
        schedules: {
          include: {
            room: true,
          },
        },
      },
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }

    // Calculate additional statistics
    const totalStudents = faculty.courses.reduce((sum, course) => sum + course._count.enrollments, 0);
    const totalSubjects = faculty.subjects.length;
    const totalCourses = faculty.courses.length;
    
    // Calculate workload statistics
    const currentWorkload = faculty.subjects.reduce((sum, subject) => sum + (subject.creditHours || 0), 0);
    
    // Get upcoming classes (next 7 days)
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(today.getDate() + 7);
    
    const upcomingClasses = faculty.schedules.filter(schedule => {
      // This would need proper date calculation based on dayOfWeek
      // For now, just return all schedules
      return true;
    });

    // Add calculated data to faculty object
    const facultyWithStats = {
      ...faculty,
      totalStudents,
      totalSubjects,
      totalCourses,
      currentWorkload,
      upcomingClasses,
    };
    
    return NextResponse.json({ faculty: facultyWithStats });
  } catch (error: any) {
    console.error('Faculty fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty data' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  try {
    const facultyId = params.facultyId;
    
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
    
    const updateData = await req.json();
    
    // Extract user and profile data
    const { user, ...facultyData } = updateData;
    
    // Update in transaction to ensure data consistency
    const updatedFaculty = await prisma.$transaction(async (tx) => {
      // Update faculty record
      const faculty = await tx.faculty.update({
        where: { id: facultyId },
        data: {
          department: facultyData.department,
        },
      });
      
      // Update user profile if provided
      if (user && user.profile) {
        await tx.profile.update({
          where: { userId: faculty.userId },
          data: {
            firstName: user.profile.firstName,
            lastName: user.profile.lastName,
            phone: user.profile.phone,
            profileImage: user.profile.profileImage,
          },
        });
      }
      
      // Update user account settings if provided (admin only)
      if (user) {
        await tx.user.update({
          where: { id: faculty.userId },
          data: {
            email: user.email,
            isApproved: user.isApproved,
            emailVerified: user.emailVerified,
          },
        });
      }
      
      return faculty;
    });
    
    // Fetch updated faculty with all relations
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    return NextResponse.json({ faculty });
  } catch (error: any) {
    console.error('Faculty update error:', error);
    return NextResponse.json(
      { message: 'Failed to update faculty data' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { facultyId: string } }
) {
  try {
    const facultyId = params.facultyId;
    
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
    
    // Get the faculty to find the user ID
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId },
      include: {
        user: true,
      }
    });

    if (!faculty) {
      return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
    }

    // Delete faculty and all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Remove faculty assignment from subjects
      await tx.subject.updateMany({
        where: { facultyId: facultyId },
        data: { facultyId: null }
      });
      
      // Remove faculty assignment from courses
      await tx.course.updateMany({
        where: { facultyId: facultyId },
        data: { facultyId: null }
      });
      
      // Delete faculty-related records
      await tx.gradeRecord.deleteMany({
        where: { facultyId: facultyId }
      });
      
      await tx.workload.deleteMany({
        where: { facultyId: facultyId }
      });
      
      await tx.leave.deleteMany({
        where: { facultyId: facultyId }
      });
      
      await tx.schedule.deleteMany({
        where: { facultyId: facultyId }
      });

      // Delete the faculty record
      await tx.faculty.delete({
        where: { id: facultyId }
      });

      // Delete user profile
      await tx.profile.deleteMany({
        where: { userId: faculty.userId }
      });

      // Delete approvals related to this user
      await tx.approval.deleteMany({
        where: {
          OR: [
            { adminId: faculty.userId },
            { userId: faculty.userId }
          ]
        }
      });

      // Finally, delete the user account
      await tx.user.delete({
        where: { id: faculty.userId }
      });
    });

    return NextResponse.json({ 
      message: 'Faculty and associated user account deleted successfully' 
    });
  } catch (error: any) {
    console.error('Faculty deletion error:', error);
    return NextResponse.json(
      { message: 'Failed to delete faculty', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
