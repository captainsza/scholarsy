import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import { getSessionUser } from '@/lib/session-utils';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  console.log('Student dashboard API called');
  try {
    // Get the current user from session
    let user;
    
    try {
      user = await getSessionUser(req);
    } catch (sessionError) {
      console.error('Session fetch failed:', sessionError);
      
      // Fallback to direct cookie parsing
      const cookieStore = await cookies();
      const token = cookieStore.get('auth-token')?.value;
      
      if (!token) {
        return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
      }
      
      // Let's just return error since we'd need to decode the token
      return NextResponse.json({ message: 'Session error' }, { status: 401 });
    }
    
    console.log('Session user:', user ? `ID: ${user.id}, Role: ${user.role}` : 'Not found');
    
    if (!user) {
      return NextResponse.json({ message: 'Authentication required' }, { status: 401 });
    }

    // Verify user is a student
    if (user.role !== 'STUDENT') {
      console.log('Access denied - user role is', user.role);
      return NextResponse.json({ message: 'Student access required' }, { status: 403 });
    }
    
    // Get student record with details
    const student = await prisma.student.findFirst({
      where: { userId: user.id },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });
    
    console.log('Student data retrieved:', student ? `ID: ${student.id}, EnrollmentID: ${student.enrollmentId}` : 'Not found');
    
    if (!student) {
      return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
    }

    // FIX: Handle registration queries more safely
    // First find all registrations without including potentially missing courses
    const registrationsRaw = await prisma.registration.findMany({
      where: { studentId: student.id },
      select: {
        id: true,
        courseId: true,
        semester: true
      }
    });

    console.log(`Retrieved ${registrationsRaw.length} raw registrations`);

    // Then get the valid courseIds
    const courseIds = registrationsRaw.map(reg => reg.courseId);
    
    // Fetch courses separately so we only get valid ones
    const courses = await prisma.course.findMany({
      where: { 
        id: { in: courseIds }
      }
    });
    
    console.log(`Found ${courses.length} valid courses out of ${courseIds.length} registrations`);

    // Use section enrollments for a more reliable way to get enrollment data
    const sectionEnrollments = await prisma.sectionEnrollment.findMany({
      where: { studentId: student.id, status: 'ACTIVE' },
      include: {
        section: {
          include: {
            course: true,
            subjects: {
              include: {
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
            }
          }
        }
      }
    });
    console.log(`Found ${sectionEnrollments.length} section enrollments`);

    // Extract subjects safely
    const subjects: any[] = [];
    sectionEnrollments.forEach(enrollment => {
      if (enrollment.section && enrollment.section.subjects) {
        enrollment.section.subjects.forEach(subject => {
          subjects.push({
            ...subject,
            sectionName: enrollment.section.name,
            courseName: enrollment.section.course?.name || 'Unknown Course',
            courseId: enrollment.section.courseId
          });
        });
      }
    });
    console.log(`Found ${subjects.length} total subjects`);

    // Format courses with proper faculty data
    const formattedCourses = subjects.map(subject => {
      const facultyName = subject.faculty?.user?.profile 
        ? `${subject.faculty.user.profile.firstName} ${subject.faculty.user.profile.lastName}`
        : 'Not Assigned';
      
      return {
        id: subject.id,
        code: subject.code,
        name: subject.name,
        credits: subject.creditHours || 0,
        faculty: {
          name: facultyName
        }
      };
    });

    // Get attendance records
    const attendanceData = await Promise.all(
      subjects.map(async (subject) => {
        const attendanceRecords = await prisma.subjectAttendance.findMany({
          where: {
            subjectId: subject.id,
            studentId: student.id
          }
        });

        const present = attendanceRecords.filter(record => record.status === 'PRESENT').length;
        const absent = attendanceRecords.filter(record => record.status === 'ABSENT').length;
        const late = attendanceRecords.filter(record => record.status === 'LATE').length;

        const total = present + absent + late;
        const percentage = total > 0 ? Math.round((present / total) * 100) : 100; // Default to 100% if no records

        return {
          courseName: `${subject.code}: ${subject.name}`,
          present,
          absent,
          late,
          percentage
        };
      })
    );

    // Calculate overall attendance percentage
    const totalClasses = attendanceData.reduce((sum, item) => sum + item.present + item.absent + item.late, 0);
    const totalPresent = attendanceData.reduce((sum, item) => sum + item.present, 0);
    const overallAttendance = totalClasses > 0 ? Math.round((totalPresent / totalClasses) * 100) : 100;
    console.log(`Overall attendance: ${overallAttendance}% (${totalPresent}/${totalClasses} classes)`);

    // Get upcoming assignments (safely handle if the model doesn't exist)
    let formattedAssignments: any[] = [];
    let pendingCount = 0;
    
    try {
      // Get all subjects IDs
      const subjectIds = subjects.map(subject => subject.id);
      
      // Fetch assessments for these subjects with due dates in the future
      const assessments = await prisma.assessment.findMany({
        where: {
          subjectId: { in: subjectIds },
          dueDate: { gte: new Date() }
        },
        include: {
          subject: true,
          marks: {
            where: { 
              studentId: student.id 
            }
          }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      });

      console.log(`Found ${assessments.length} upcoming assessments`);
      
      // Format assessments as assignments
      formattedAssignments = assessments.map(assessment => {
        const submission = assessment.marks.length > 0 ? assessment.marks[0] : null;
        let status: "pending" | "submitted" | "graded" = "pending";

        if (submission) {
          status = submission.evaluatedAt ? "graded" : "submitted";
        }

        return {
          id: assessment.id,
          title: assessment.title,
          courseCode: assessment.subject.code,
          courseName: assessment.subject.name,
          dueDate: assessment.dueDate?.toISOString() || new Date().toISOString(),
          status
        };
      });

      // Count pending assignments
      pendingCount = formattedAssignments.filter(a => a.status === "pending").length;
    } catch (error) {
      console.error("Assessment fetch error:", error);
      formattedAssignments = [];
      pendingCount = 0;
    }

    // Get grade records
    const gradeRecords = await prisma.gradeRecord.findMany({
      where: { 
        studentId: student.id,
        courseId: { in: courseIds }
      },
      include: { course: true }
    });
    console.log(`Found ${gradeRecords.length} grade records`);

    // Format grades
    const formattedGrades = gradeRecords.map(record => {
      // Calculate grade based on total mark
      let grade = 'N/A';
      const totalMark = record.totalMark || 0;
      
      if (totalMark >= 90) grade = 'A+';
      else if (totalMark >= 80) grade = 'A';
      else if (totalMark >= 70) grade = 'B+';
      else if (totalMark >= 60) grade = 'B';
      else if (totalMark >= 50) grade = 'C+';
      else if (totalMark >= 40) grade = 'C';
      else if (totalMark >= 35) grade = 'D';
      else grade = 'F';
      
      return {
        courseCode: record.course.code,
        courseName: record.course.name,
        sessionalMark: record.sessionalMark || 0,
        attendanceMark: record.attendanceMark || 0,
        totalMark: record.totalMark || 0,
        grade: grade
      };
    });

    // Calculate average grade point
    const gradePoints: Record<string, number> = {
      'A+': 10, 'A': 9, 'B+': 8, 'B': 7, 'C+': 6, 'C': 5, 'D': 4, 'F': 0
    };
    
    let totalGradePoints = 0;
    let gradesWithValue = 0;
    
    formattedGrades.forEach(grade => {
      if (grade.grade in gradePoints) {
        totalGradePoints += gradePoints[grade.grade];
        gradesWithValue++;
      }
    });
    
    const avgGrade = gradesWithValue > 0 ? parseFloat((totalGradePoints / gradesWithValue).toFixed(2)) : 0;
    console.log(`Average grade point: ${avgGrade} (from ${gradesWithValue} graded courses)`);

    // Return dashboard data
    console.log('Student dashboard data compiled successfully');
    return NextResponse.json({
      enrolledCourses: formattedCourses.length,
      attendancePercentage: overallAttendance || 100, // Default to 100 if calculation fails
      pendingAssignments: pendingCount,
      avgGrade,
      courses: formattedCourses,
      attendance: attendanceData || [],
      assignments: formattedAssignments,
      grades: formattedGrades
    });

  } catch (error: any) {
    console.error('Student dashboard data fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student dashboard data', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
