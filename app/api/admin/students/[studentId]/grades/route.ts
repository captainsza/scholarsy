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
    
    // Only admin and relevant faculty/student should have access
    if (decoded.role !== 'ADMIN' && decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Admin or faculty access required' }, { status: 403 });
    }
    
    const studentId = params.studentId;
    
    // Check if student exists
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
    
    if (!student) {
      return NextResponse.json({ message: 'Student not found' }, { status: 404 });
    }

    // Fetch all grade records for this student
    const gradeRecords = await prisma.gradeRecord.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        course: true,
        faculty: {
          include: {
            user: {
              include: {
                profile: true,
              },
            },
          },
        },
      },
      orderBy: [
        { semester: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Fetch assessment marks for the student
    const assessmentMarks = await prisma.assessmentMark.findMany({
      where: {
        studentId: studentId,
      },
      include: {
        assessment: {
          include: {
            subject: {
              include: {
                course: true,
              },
            },
          },
        },
      },
    });

    // Transform the data for the frontend with grade calculation logic
    const gradesData = gradeRecords.map(record => {
      // Map numeric grade to letter grade (example logic - adjust as needed)
      const getLetterGrade = (percentage: number) => {
        if (percentage >= 90) return 'A+';
        if (percentage >= 85) return 'A';
        if (percentage >= 80) return 'A-';
        if (percentage >= 75) return 'B+';
        if (percentage >= 70) return 'B';
        if (percentage >= 65) return 'B-';
        if (percentage >= 60) return 'C+';
        if (percentage >= 55) return 'C';
        if (percentage >= 50) return 'C-';
        if (percentage >= 45) return 'D+';
        if (percentage >= 40) return 'D';
        return 'F';
      };
      
      // Map letter grade to GPA points
      const getGradePoint = (letterGrade: string) => {
        const gradePoints: Record<string, number> = {
          'A+': 4.0,
          'A': 4.0,
          'A-': 3.7,
          'B+': 3.3,
          'B': 3.0,
          'B-': 2.7,
          'C+': 2.3,
          'C': 2.0,
          'C-': 1.7,
          'D+': 1.3,
          'D': 1.0,
          'F': 0.0,
        };
        return gradePoints[letterGrade] || 0;
      };
      
      // Calculate percentage from total mark (assuming totalMark is out of 100)
      const percentage = record.totalMark;
      const letterGrade = getLetterGrade(percentage);
      const gradePoint = getGradePoint(letterGrade);
      
      // Find related assessments for this course
      const courseAssessments = assessmentMarks.filter(mark => 
        mark.assessment.subject.course.id === record.courseId
      ).map(mark => ({
        id: mark.id,
        name: mark.assessment.title,
        type: mark.assessment.type,
        maxMarks: mark.assessment.maxMarks,
        marksObtained: mark.marksObtained,
        percentage: (mark.marksObtained / mark.assessment.maxMarks) * 100,
        weight: mark.assessment.weightage,
        contributionToFinal: (mark.marksObtained / mark.assessment.maxMarks) * mark.assessment.weightage,
      }));
      
      return {
        id: record.id,
        courseId: record.courseId,
        courseName: record.course.name,
        courseCode: `${record.course.name.substring(0, 3).toUpperCase()}${record.course.id.substring(0, 3)}`,
        semester: record.semester,
        academicYear: new Date(record.createdAt).getFullYear().toString(),
        finalGrade: letterGrade,
        gradePoint: gradePoint,
        percentage: percentage,
        faculty: record.faculty ? `${record.faculty.user.profile?.firstName || ''} ${record.faculty.user.profile?.lastName || ''}`.trim() : 'Unknown',
        assessments: courseAssessments,
      };
    });

    // Calculate CGPA and other summary statistics
    const totalGradePoints = gradesData.reduce((sum, grade) => sum + grade.gradePoint, 0);
    const cgpa = gradesData.length > 0 ? totalGradePoints / gradesData.length : 0;
    
    // Assuming each course has the same credit value for simplicity
    // In a real system, you'd use actual credit hours from course data
    const totalCredits = gradesData.length * 3; // Assuming 3 credits per course

    return NextResponse.json({
      grades: gradesData,
      summary: {
        cgpa: cgpa,
        totalCredits: totalCredits,
        totalCourses: gradesData.length,
        highestGrade: gradesData.length > 0 ? 
          gradesData.reduce((max, grade) => grade.percentage > max.percentage ? grade : max, gradesData[0]).finalGrade 
          : null,
        lowestGrade: gradesData.length > 0 ? 
          gradesData.reduce((min, grade) => grade.percentage < min.percentage ? grade : min, gradesData[0]).finalGrade 
          : null,
      }
    });
  } catch (error: any) {
    console.error('Student grades fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch student grades', error: error.message },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
