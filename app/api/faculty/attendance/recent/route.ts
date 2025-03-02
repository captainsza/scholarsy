import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get recent attendance records for a faculty
export async function GET(req: NextRequest) {
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

    // Get all subjects taught by the faculty
    const subjects = await prisma.subject.findMany({
      where: { facultyId },
      select: { id: true }
    });

    const subjectIds = subjects.map(subject => subject.id);

    // Get recent attendance records (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const attendanceRecords = await prisma.subjectAttendance.groupBy({
      by: ['subjectId', 'date'],
      where: {
        subjectId: { in: subjectIds },
        date: { gte: thirtyDaysAgo }
      },
      _count: {
        id: true
      },
      orderBy: {
        date: 'desc'
      }
    });

    // For each group, get additional information
    const records = await Promise.all(
      attendanceRecords.map(async (record) => {
        // Get subject details
        const subject = await prisma.subject.findUnique({
          where: { id: record.subjectId },
          include: {
            section: true
          }
        });

        // Get status counts for this date and subject
        const statusCounts = await prisma.subjectAttendance.groupBy({
          by: ['status'],
          where: {
            subjectId: record.subjectId,
            date: record.date
          },
          _count: {
            id: true
          }
        });

        // Calculate counts for present, absent, and late
        let presentCount = 0;
        let absentCount = 0;
        let lateCount = 0;

        statusCounts.forEach(statusCount => {
          if (statusCount.status === 'PRESENT') {
            presentCount = statusCount._count.id;
          } else if (statusCount.status === 'ABSENT') {
            absentCount = statusCount._count.id;
          } else if (statusCount.status === 'LATE') {
            lateCount = statusCount._count.id;
          }
        });

        const totalStudents = presentCount + absentCount + lateCount;

        return {
          id: `${record.subjectId}-${record.date.toISOString()}`,
          subjectId: record.subjectId,
          date: record.date,
          subject: {
            id: record.subjectId,
            name: subject?.name || 'Unknown',
            code: subject?.code || 'Unknown',
            section: {
              id: subject?.section?.id || '',
              name: subject?.section?.name || 'Unknown'
            }
          },
          totalStudents,
          presentCount,
          absentCount,
          lateCount
        };
      })
    );

    // Calculate overall statistics
    const allAttendance = await prisma.subjectAttendance.findMany({
      where: {
        subjectId: { in: subjectIds }
      }
    });

    const statistics = {
      total: new Set(allAttendance.map(record => 
        `${record.subjectId}-${record.date.toISOString()}`
      )).size,
      present: allAttendance.filter(record => record.status === 'PRESENT').length,
      absent: allAttendance.filter(record => record.status === 'ABSENT').length,
      late: allAttendance.filter(record => record.status === 'LATE').length
    };

    return NextResponse.json({ 
      records,
      statistics
    });
  } catch (error) {
    console.error("Failed to fetch recent attendance:", error);
    return NextResponse.json(
      { message: "Failed to fetch recent attendance" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
