import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }
    
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json({ message: 'Faculty ID is required' }, { status: 400 });
    }

    // Get subjects directly assigned to faculty
    const subjects = await prisma.subject.findMany({
      where: { facultyId },
      include: {
        course: {
          include: {
            enrollments: {
              where: { status: 'ACTIVE' },
              include: { student: true }
            }
          }
        },
        faculty: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        attendances: true,
        assessments: true,
      },
      orderBy: {
        name: 'asc'
      }
    });

    // Transform data for response
    const transformedSubjects = subjects.map(subject => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      description: subject.description,
      creditHours: subject.creditHours,
      courseId: subject.courseId,
      courseName: subject.course?.name,
      courseBranch: subject.course?.branch,
      courseYear: subject.course?.year,
      courseSemester: subject.course?.semester,
      studentCount: subject.course?.enrollments?.length || 0,
      attendanceCount: subject.attendances?.length || 0,
      assessmentCount: subject.assessments?.length || 0,
      facultyName: subject.faculty?.user?.profile 
        ? `${subject.faculty.user.profile.firstName} ${subject.faculty.user.profile.lastName}`
        : "Not assigned"
    }));

    // Get courses that the faculty coordinates
    const coordinatedCourses = await prisma.course.findMany({
      where: { facultyId },
      include: {
        subjects: true,
        enrollments: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    // Transform course data
    const transformedCourses = coordinatedCourses.map(course => ({
      id: course.id,
      name: course.name,
      branch: course.branch,
      year: course.year,
      semester: course.semester,
      studentCount: course.enrollments?.length || 0,
      subjectCount: course.subjects?.length || 0,
      isCoordinator: true
    }));

    return NextResponse.json({
      subjects: transformedSubjects,
      coordinatedCourses: transformedCourses
    });

  } catch (error: any) {
    console.error('Faculty subjects fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty subjects', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json({ message: "Faculty ID is required" }, { status: 400 });
    }

    // Check if faculty exists
    const faculty = await prisma.faculty.findUnique({
      where: { id: facultyId }
    });

    if (!faculty) {
      return NextResponse.json({ message: "Faculty not found" }, { status: 404 });
    }

    // Parse request body
    const { name, code, description, creditHours } = await req.json();
    
    // Validate required fields
    if (!name || !code || !creditHours) {
      return NextResponse.json(
        { message: "Missing required fields: name, code, creditHours" },
        { status: 400 }
      );
    }

    // Check if section exists




    // Create the new subject
    const subject = await prisma.subject.create({
      data: {
        name,
        code,
        description,
        creditHours,
        facultyId,
      }
    });

    return NextResponse.json({ 
      message: "Subject created successfully",
      subject
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to create subject:", error);
    return NextResponse.json(
      { message: "Failed to create subject" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
