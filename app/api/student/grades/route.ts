import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get student grades by semester
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const studentId = url.searchParams.get('studentId');
    const semester = url.searchParams.get('semester');
    
    if (!studentId) {
      return NextResponse.json(
        { message: "Student ID is required" },
        { status: 400 }
      );
    }

    // Get subjects the student is enrolled in via section enrollments
    const enrollments = await prisma.sectionEnrollment.findMany({
      where: {
        studentId,
        status: 'ACTIVE'
      },
      include: {
        section: {
          include: {
            course: true,
            subjects: true
          }
        }
      }
    });
    
    // Extract unique subjects
    const subjectIds = enrollments.flatMap(enrollment => 
      enrollment.section.subjects.map(subject => subject.id)
    );
    
    // Get assessments for these subjects
    const assessments = await prisma.assessment.findMany({
      where: {
        subjectId: { in: subjectIds }
      },
      include: {
        subject: true,
        marks: {
          where: {
            studentId
          }
        }
      }
    });
    
    // Get internal marks for the student
    const internalMarks = await prisma.gradeRecord.findMany({
      where: {
        studentId,
        ...(semester ? { semester } : {})
      },
      include: {
        course: true
      }
    });

    // Prepare subjects with grades for response
    const subjects = await prisma.subject.findMany({
      where: {
        id: { in: subjectIds }
      },
      include: {
        section: {
          include: {
            course: true
          }
        }
      }
    });

    // Enrich subjects with grade data
    const enrichedSubjects = subjects.map(subject => {
      // Find corresponding internal mark
      const mark = internalMarks.find(mark => 
        mark.course.id === subject.section.courseId
      );
      
      // Find relevant assessments
      const subjectAssessments = assessments.filter(
        assessment => assessment.subjectId === subject.id
      );
      
      return {
        ...subject,
        internalMarks: mark,
        assessments: subjectAssessments
      };
    });

    // Prepare assessments for the response
    const formattedAssessments = assessments.map(assessment => ({
      ...assessment,
      mark: assessment.marks.length > 0 ? assessment.marks[0] : null
    }));

    // Generate progress data for charts
    const progressData = generateProgressData(internalMarks, formattedAssessments);

    return NextResponse.json({
      subjects: enrichedSubjects,
      assessments: formattedAssessments,
      progressData
    });
  } catch (error) {
    console.error("Failed to fetch student grades:", error);
    return NextResponse.json(
      { message: "Failed to fetch student grades" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to generate progress data
function generateProgressData(internalMarks: any[], assessments: any[]) {
  // Group marks by semester or time period
  const groupedData: Record<string, any> = {};
  
  // Process internal marks
  internalMarks.forEach(mark => {
    if (!groupedData[mark.semester]) {
      groupedData[mark.semester] = {
        totalMarks: 0,
        count: 0,
        gpaPoints: 0
      };
    }
    
    groupedData[mark.semester].totalMarks += mark.totalMark || 0;
    groupedData[mark.semester].count += 1;
    
    // Calculate GPA points (simplified scale)
    let gpaPoints = 0;
    if (mark.totalMark >= 90) gpaPoints = 4.0;
    else if (mark.totalMark >= 80) gpaPoints = 3.7;
    else if (mark.totalMark >= 70) gpaPoints = 3.3;
    else if (mark.totalMark >= 60) gpaPoints = 3.0;
    else if (mark.totalMark >= 50) gpaPoints = 2.0;
    else if (mark.totalMark >= 40) gpaPoints = 1.0;
    
    groupedData[mark.semester].gpaPoints += gpaPoints;
  });
  
  // Calculate averages and format for chart
  return Object.entries(groupedData).map(([name, data]: [string, any]) => ({
    name,
    averageMark: data.count > 0 ? data.totalMarks / data.count : 0,
    gpa: data.count > 0 ? (data.gpaPoints / data.count) * 25 : 0, // Scale GPA to percentage for chart
    classAverage: 70 // Placeholder - would be calculated from all students
  })).sort((a, b) => a.name.localeCompare(b.name));
}
