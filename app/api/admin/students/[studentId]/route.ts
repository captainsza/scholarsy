import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const studentId = params.studentId;

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

    // Fetch the student with related data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        courseEnrollments: {
          include: {
            course: true,
          },
          take: 5,
          orderBy: {
            enrolledAt: 'desc',
          },
        },
        _count: {
          select: {
            courseEnrollments: true,
            gradeRecords: true,
            attendance: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Get total enrollments count
    const totalEnrollments = await prisma.courseEnrollment.count({
      where: { studentId: student.id },
    });

    // Get recent activities
    const recentActivities = await Promise.all([
      // Recent attendances
      prisma.attendance.findMany({
        where: { studentId: student.id },
        orderBy: { date: 'desc' },
        take: 3,
        include: {
          course: true,
        },
      }),
      
      // Recent grade records
      prisma.gradeRecord.findMany({
        where: { studentId: student.id },
        orderBy: { updatedAt: 'desc' },
        take: 3,
        include: {
          course: true,
        },
      }),
    ]);

    // Transform the data for API response
    const transformedData = {
      ...student,
      stats: {
        totalEnrollments,
        totalCourses: student._count.courseEnrollments,
        totalGradeRecords: student._count.gradeRecords,
        totalAttendance: student._count.attendance,
      },
      recentActivities: {
        attendance: recentActivities[0],
        grades: recentActivities[1],
      },
    };

    return NextResponse.json({ student: transformedData });
  } catch (error: any) {
    console.error('Student fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const studentId = params.studentId;
    const data = await req.json();
    
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

    // Extract profile data and student data
    const { 
      firstName, lastName, phone, profileImage,
      ...studentData 
    } = data;

    // Update student record
    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: studentData,
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    // If profile data was provided, update the profile
    if (firstName || lastName || phone || profileImage) {
      const profileData: any = {};
      if (firstName !== undefined) profileData.firstName = firstName;
      if (lastName !== undefined) profileData.lastName = lastName;
      if (phone !== undefined) profileData.phone = phone;
      if (profileImage !== undefined) profileData.profileImage = profileImage;

      await prisma.profile.update({
        where: { userId: updatedStudent.userId },
        data: profileData,
      });
    }

    // Fetch the updated student with profile
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return NextResponse.json({ student });
  } catch (error: any) {
    console.error('Student update error:', error);
    return NextResponse.json(
      { message: 'Failed to update student', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const studentId = params.studentId;
    
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

    // Get the student to find the user ID
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Delete the student
    await prisma.student.delete({
      where: { id: studentId },
    });

    return NextResponse.json({ message: 'Student deleted successfully' });
  } catch (error: any) {
    console.error('Student deletion error:', error);
    return NextResponse.json(
      { message: 'Failed to delete student', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
