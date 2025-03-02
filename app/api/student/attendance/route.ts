import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    // Get studentId from query parameter
    const studentId = req.nextUrl.searchParams.get('studentId');
    
    if (!studentId) {
      return NextResponse.json({ message: "Student ID is required" }, { status: 400 });
    }

    // Verify the student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ message: "Student not found" }, { status: 404 });
    }

    // Get all enrollments for the student
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: { 
        studentId,
        status: 'ACTIVE' 
      },
      include: {
        section: {
          include: {
            subjects: true,
            course: true
          }
        }
      }
    });

    // Get all subjects the student is enrolled in
    const subjectIds = enrollments.flatMap(enrollment => 
      enrollment.section.subjects.map(subject => subject.id)
    );

    // Get all attendance records for these subjects
    const attendanceRecords = await prisma.subjectAttendance.findMany({
      where: {
        studentId,
        subjectId: { in: subjectIds }
      },
      include: {
        subject: {
          select: {
            id: true,
            name: true,
            code: true,
            section: {
              select: {
                id: true,
                name: true,
                course: {
                  select: {
                    id: true, 
                    name: true,
                    code: true
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        date: 'desc'
      }
    });

    // Group attendance records by subject and calculate stats
    const subjectAttendance = subjectIds.map(subjectId => {
      const subjectRecords = attendanceRecords.filter(record => record.subject.id === subjectId);
      if (subjectRecords.length === 0) return null;
      
      const subject = subjectRecords[0].subject;
      
      // Calculate stats
      const presentCount = subjectRecords.filter(record => record.status === 'PRESENT').length;
      const absentCount = subjectRecords.filter(record => record.status === 'ABSENT').length;
      const lateCount = subjectRecords.filter(record => record.status === 'LATE').length;
      
      const totalClasses = subjectRecords.length;
      const percentage = Math.round((presentCount / totalClasses) * 100);
      
      const lastUpdated = subjectRecords
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date;
      
      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        section: subject.section,
        attendanceRecords: subjectRecords.map(record => ({
          id: record.id,
          date: record.date,
          status: record.status,
          remarks: record.remarks
        })),
        stats: {
          presentCount,
          absentCount,
          lateCount,
          totalClasses,
          percentage
        },
        lastUpdated
      };
    }).filter(Boolean); // Remove null entries

    return NextResponse.json({
      studentId,
      subjects: subjectAttendance
    });
  } catch (error) {
    console.error("Failed to fetch student attendance:", error);
    return NextResponse.json(
      { message: "Failed to fetch attendance data" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
