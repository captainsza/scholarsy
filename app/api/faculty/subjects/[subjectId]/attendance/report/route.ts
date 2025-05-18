import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, SubjectAttendance } from '@prisma/client';
import { getUserFromToken } from '@/lib/jwt-utils'; // Assuming this utility exists

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  context: { params: { subjectId: string } }
) {
  try {
    const user = await getUserFromToken(req);
    if (!user || user.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Authentication required or invalid role' }, { status: 401 });
    }

    const faculty = await prisma.faculty.findUnique({ where: { userId: user.id } });
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }

    const { subjectId } = context.params;

    // Verify faculty access to the subject
    const subjectAccess = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        OR: [
          { facultyId: faculty.id },
          { course: { facultyId: faculty.id } },
        ],
      },
      include: {
        course: true, // Needed for course name and student enrollments
      },
    });

    if (!subjectAccess || !subjectAccess.course) {
      return NextResponse.json({ message: 'Access denied or subject/course not found' }, { status: 403 });
    }

    const subjectInfo = {
      id: subjectAccess.id,
      name: subjectAccess.name,
      code: subjectAccess.code,
      courseName: subjectAccess.course.name,
      courseId: subjectAccess.courseId,
    };

    // Get all enrolled students in the subject's course
    const enrollments = await prisma.courseEnrollment.findMany({
      where: {
        courseId: subjectAccess.courseId,
        status: 'ACTIVE',
      },
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
    });

    const students = enrollments
      .map(e => e.student)
      .filter(s => s && s.user && s.user.profile);


    // Get all attendance records for this subject
    const attendanceRecords = await prisma.subjectAttendance.findMany({
      where: { subjectId },
    });

    // Calculate total distinct class sessions for this subject
    const distinctDates = new Set(attendanceRecords.map(ar => new Date(ar.date).toDateString()));
    const totalDistinctSessions = distinctDates.size;

    const studentAttendanceSummaries = students.map(student => {
      if (!student || !student.user?.profile) return null; // Should not happen due to filter

      const studentRecords = attendanceRecords.filter(ar => ar.studentId === student.id);
      const presentCount = studentRecords.filter(ar => ar.status === 'PRESENT').length;
      const absentCount = studentRecords.filter(ar => ar.status === 'ABSENT').length;
      const lateCount = studentRecords.filter(ar => ar.status === 'LATE').length;
      
      // Total sessions for this student is the number of records they have.
      // Or, if we assume attendance was taken for all students in all distinct sessions:
      const totalSessionsForStudent = studentRecords.length > 0 ? totalDistinctSessions : 0;
      // If a student has no records, their attendance percentage is 0.
      // If a student has records, base percentage on distinct sessions for the subject.
      
      let attendancePercentage = 0;
      if (totalDistinctSessions > 0 && studentRecords.length > 0) {
         // Consider 'PRESENT' and 'LATE' as attended for percentage calculation
        attendancePercentage = ((presentCount + lateCount) / totalDistinctSessions) * 100;
      } else if (totalDistinctSessions === 0) {
        attendancePercentage = 0; // Or 100 if no classes held, depends on policy
      }


      return {
        studentId: student.id,
        studentName: `${student.user.profile.firstName} ${student.user.profile.lastName}`,
        enrollmentId: student.enrollmentId,
        profileImage: student.user.profile.profileImage,
        presentCount,
        absentCount,
        lateCount,
        totalSessionsAttendedByStudent: studentRecords.length, // How many sessions this student has a record for
        attendancePercentage: parseFloat(attendancePercentage.toFixed(2)),
      };
    }).filter(summary => summary !== null);


    // Overall statistics for the subject
    const totalPresentOverall = attendanceRecords.filter(ar => ar.status === 'PRESENT').length;
    const totalAbsentOverall = attendanceRecords.filter(ar => ar.status === 'ABSENT').length;
    const totalLateOverall = attendanceRecords.filter(ar => ar.status === 'LATE').length;
    const totalAttendanceEntries = attendanceRecords.length;

    // Overall percentage based on total entries vs total possible entries (students * distinct sessions)
    const totalPossibleEntries = students.length * totalDistinctSessions;
    let overallPresentPercentage = 0;
    if (totalPossibleEntries > 0) {
        overallPresentPercentage = ((totalPresentOverall + totalLateOverall) / totalPossibleEntries) * 100;
    }


    const overallReportStats = {
      totalDistinctSessions,
      totalStudents: students.length,
      totalAttendanceEntries,
      totalPresentOverall,
      totalAbsentOverall,
      totalLateOverall,
      overallAttendancePercentage: parseFloat(overallPresentPercentage.toFixed(2)),
    };

    return NextResponse.json({
      subjectInfo,
      studentAttendanceSummaries,
      overallReportStats,
    });

  } catch (error: any) {
    console.error('Failed to fetch attendance report data:', error);
    return NextResponse.json({ message: 'Failed to fetch report data', error: error.message }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
