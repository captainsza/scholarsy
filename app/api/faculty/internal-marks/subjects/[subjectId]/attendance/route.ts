import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get attendance statistics for students in a subject
export async function GET(
  req: NextRequest,
  context: { params: { subjectId: string } }
) {
  try {
    const { subjectId } = context.params;
    
    // Verify the subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        section: true
      }
    });

    if (!subject) {
      return NextResponse.json(
        { message: "Subject not found" },
        { status: 404 }
      );
    }

    // Get all students enrolled in this section
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: {
        sectionId: subject.sectionId,
        status: "ACTIVE"
      },
      select: {
        studentId: true
      }
    });

    const studentIds = enrollments.map(enrollment => enrollment.studentId);

    // Get all attendance records for this subject
    const attendanceRecords = await prisma.subjectAttendance.findMany({
      where: {
        subjectId,
        studentId: { in: studentIds }
      }
    });

    // Calculate percentage for each student
    const totalClasses = await prisma.subjectAttendance.groupBy({
      by: ['date'],
      where: { subjectId }
    });
    
    const totalClassCount = totalClasses.length;
    
    // If no classes have been recorded yet, return 100% for all students
    if (totalClassCount === 0) {
      const attendance = studentIds.map(studentId => ({
        studentId,
        totalClasses: 0,
        presentClasses: 0,
        attendancePercentage: 100 // Default to 100% if no classes yet
      }));
      
      return NextResponse.json({ attendance });
    }

    // Calculate attendance percentage for each student
    const attendance = studentIds.map(studentId => {
      const studentAttendance = attendanceRecords.filter(
        record => record.studentId === studentId
      );
      
      const presentCount = studentAttendance.filter(
        record => record.status === "PRESENT"
      ).length;
      
      const attendancePercentage = Math.round((presentCount / totalClassCount) * 100);
      
      return {
        studentId,
        totalClasses: totalClassCount,
        presentClasses: presentCount,
        attendancePercentage
      };
    });

    return NextResponse.json({ attendance });
  } catch (error) {
    console.error("Failed to fetch attendance:", error);
    return NextResponse.json(
      { message: "Failed to fetch attendance" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
