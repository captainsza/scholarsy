import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

// GET: Get attendance data for a particular subject and date
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

    // Get parameters
    const { courseId, subjectId } = params;
    const dateParam = req.nextUrl.searchParams.get("date");
    
    if (!dateParam) {
      return NextResponse.json(
        { message: "Date parameter is required" },
        { status: 400 }
      );
    }

    // Parse the date
    const date = new Date(dateParam);
    date.setHours(0, 0, 0, 0);
    
    const nextDay = new Date(date);
    nextDay.setDate(date.getDate() + 1);

    // First validate that the subject exists and belongs to the course
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        courseId: courseId
      }
    });

    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found or doesn't belong to this course" },
        { status: 404 }
      );
    }

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

    // Check if the subject is assigned to this faculty
    if (subject.facultyId !== faculty.id && subject.course?.facultyId !== faculty.id) {
      return NextResponse.json(
        { message: "You don't have permission to access this subject's attendance" },
        { status: 403 }
      );
    }

    // Get students enrolled in this course
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: courseId,
        status: "ACTIVE"
      },
      include: {
        student: {
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

    // Get existing attendance records for that date and subject
    const attendanceRecords = await prisma.subjectAttendance.findMany({
      where: {
        subjectId,
        date: {
          gte: date,
          lt: nextDay
        }
      }
    });

    // Map students with their attendance status
    const students = enrollments.map(enrollment => {
      const student = enrollment.student;
      const attendanceRecord = attendanceRecords.find(ar => ar.studentId === student.id);

      return {
        id: student.id,
        name: student.user.profile ? 
              `${student.user.profile.firstName} ${student.user.profile.lastName}` : 
              'Unknown',
        enrollmentId: student.enrollmentId,
        profileImage: student.user.profile?.profileImage,
        attendanceStatus: attendanceRecord?.status || null,
        attendanceId: attendanceRecord?.id || null
      };
    });

    return NextResponse.json({ students });
  } catch (error: any) {
    console.error("Get attendance error:", error);
    return NextResponse.json(
      { message: "Failed to fetch attendance data", error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Save attendance records
export async function POST(
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
    const { date, attendance } = await req.json();

    if (!date || !attendance || !Array.isArray(attendance)) {
      return NextResponse.json(
        { message: "Invalid request data" },
        { status: 400 }
      );
    }

    // First validate that the subject exists and belongs to the course
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        courseId: courseId
      }
    });

    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found or doesn't belong to this course" },
        { status: 404 }
      );
    }

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

    // Check if the subject is assigned to this faculty
    if (subject.facultyId !== faculty.id && subject.course?.facultyId !== faculty.id) {
      return NextResponse.json(
        { message: "You don't have permission to manage this subject's attendance" },
        { status: 403 }
      );
    }

    // Parse the date
    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Process attendance records in a transaction
    const results = await prisma.$transaction(async (tx) => {
      const records = [];
      
      for (const record of attendance) {
        const { studentId, status, attendanceId } = record;
        
        // Validate student is enrolled in this course
        const enrollment = await tx.courseEnrollment.findFirst({
          where: {
            studentId,
            courseId,
            status: "ACTIVE"
          }
        });
        
        if (!enrollment) {
          continue; // Skip this record if student not enrolled
        }
        
        if (attendanceId) {
          // Update existing record
          const updated = await tx.subjectAttendance.update({
            where: { id: attendanceId },
            data: { status }
          });
          records.push(updated);
        } else {
          // Create new record
          const created = await tx.subjectAttendance.create({
            data: {
              studentId,
              subjectId,
              date: attendanceDate,
              status
            }
          });
          records.push(created);
        }
      }
      
      return records;
    });

    return NextResponse.json({
      message: "Attendance saved successfully",
      count: results.length
    });
  } catch (error: any) {
    console.error("Save attendance error:", error);
    return NextResponse.json(
      { message: "Failed to save attendance data", error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
