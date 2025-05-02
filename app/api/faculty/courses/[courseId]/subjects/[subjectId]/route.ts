import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: { courseId: string; subjectId: string } }
) {
  try {
    // Verify authentication
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Verify and decode the token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== "FACULTY") {
      return NextResponse.json({ message: "Faculty access required" }, { status: 403 });
    }

    const { courseId, subjectId } = params;

    // Get the faculty user
    const faculty = await prisma.faculty.findFirst({
      where: { userId: decoded.id }
    });

    if (!faculty) {
      return NextResponse.json(
        { message: "Faculty record not found" },
        { status: 404 }
      );
    }

    // Get the subject with course information
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        courseId: courseId
      },
      include: {
        course: true,
        faculty: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        }
      }
    });

    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found or doesn't belong to this course" },
        { status: 404 }
      );
    }

    // Check if the subject is assigned to this faculty or they are the course coordinator
    if (subject.facultyId !== faculty.id && subject.course.facultyId !== faculty.id) {
      return NextResponse.json(
        { message: "You don't have permission to access this subject" },
        { status: 403 }
      );
    }

    // Transform data for response
    const subjectData = {
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
      facultyId: subject.facultyId,
      facultyName: subject.faculty?.user?.profile 
        ? `${subject.faculty.user.profile.firstName} ${subject.faculty.user.profile.lastName}` 
        : null
    };

    return NextResponse.json({ subject: subjectData });
  } catch (error: any) {
    console.error("Get subject error:", error);
    return NextResponse.json(
      { message: "Failed to fetch subject data", error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
