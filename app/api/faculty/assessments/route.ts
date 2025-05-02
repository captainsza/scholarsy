import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { uploadToCloudinary } from '@/utils/cloudinary_assetmnt';

const prisma = new PrismaClient();

// GET: Fetch all assessments for a faculty
export async function GET(req: NextRequest) {
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
    
    if (decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }
    
    // Get faculty ID from query parameters or token
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    // If facultyId not provided in URL, get it from user token
    let faculty;
    if (!facultyId) {
      faculty = await prisma.faculty.findFirst({
        where: { userId: decoded.id }
      });
      
      if (!faculty) {
        return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
      }
    } else {
      faculty = await prisma.faculty.findUnique({
        where: { id: facultyId }
      });
      
      if (!faculty) {
        return NextResponse.json({ message: 'Faculty not found' }, { status: 404 });
      }
      
      // Security check: Faculty can only see their own assessments
      const requestingFaculty = await prisma.faculty.findFirst({
        where: { userId: decoded.id }
      });
      
      if (requestingFaculty?.id !== facultyId) {
        return NextResponse.json({ message: 'Access denied' }, { status: 403 });
      }
    }
    
    // Get all subjects taught by this faculty
    const subjects = await prisma.subject.findMany({
      where: { facultyId: faculty.id },
      include: { course: true }
    });
    
    // Get all assessments for these subjects
    const assessments = await prisma.assessment.findMany({
      where: {
        subjectId: { in: subjects.map(subject => subject.id) }
      },
      include: {
        subject: {
          include: {
            course: true,
          }
        },
        marks: {
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
        }
      },
      orderBy: {
        dueDate: 'desc'
      }
    });
    
    // Transform assessments for response
    const transformedAssessments = assessments.map(assessment => ({
      id: assessment.id,
      title: assessment.title,
      type: assessment.type,
      maxMarks: assessment.maxMarks,
      weightage: assessment.weightage,
      dueDate: assessment.dueDate,
      instructions: assessment.instructions,
      attachmentUrl: assessment.attachmentUrl,
      subjectId: assessment.subjectId,
      subjectName: assessment.subject.name,
      subjectCode: assessment.subject.code,
      courseName: assessment.subject.course.name,
      submissionCount: assessment.marks.length,
      totalStudents: assessment.subject.course.enrollments?.length || 0,
      isOverdue: assessment.dueDate ? new Date(assessment.dueDate) < new Date() : false
    }));
    
    return NextResponse.json({ assessments: transformedAssessments });
  } catch (error: any) {
    console.error('Assessment fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch assessments', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST: Create a new assessment
export async function POST(req: NextRequest) {
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
    
    if (decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }
    
    // Get faculty record
    const faculty = await prisma.faculty.findFirst({
      where: { userId: decoded.id }
    });
    
    if (!faculty) {
      return NextResponse.json({ message: 'Faculty record not found' }, { status: 404 });
    }
    
    // Parse request body
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const type = formData.get('type') as string;
    const subjectId = formData.get('subjectId') as string;
    const maxMarks = parseFloat(formData.get('maxMarks') as string);
    const weightage = parseFloat(formData.get('weightage') as string);
    const dueDateStr = formData.get('dueDate') as string;
    const instructions = formData.get('instructions') as string;
    const assessmentFile = formData.get('assessmentFile') as File;
    
    // Validate required fields
    if (!title || !type || !subjectId || !maxMarks) {
      return NextResponse.json(
        { message: 'Missing required fields' }, 
        { status: 400 }
      );
    }
    
    // Convert due date string to Date object if provided
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;
    
    // Verify faculty is assigned to this subject
    const subject = await prisma.subject.findFirst({
      where: {
        id: subjectId,
        facultyId: faculty.id
      },
      include: {
        course: true
      }
    });
    
    if (!subject) {
      return NextResponse.json(
        { message: 'Subject not found or not assigned to this faculty' }, 
        { status: 403 }
      );
    }
    
    // Handle file upload to Cloudinary if provided
    let attachmentUrl = null;
    if (assessmentFile) {
      const arrayBuffer = await assessmentFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Convert buffer to base64 string for Cloudinary
      const base64String = buffer.toString('base64');
      const dataURI = `data:${assessmentFile.type};base64,${base64String}`;
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        dataURI,
        `assessment_${subject.code}_${Date.now()}`
      );
      
      attachmentUrl = result.secure_url;
    }
    
    // Create the assessment
    const assessment = await prisma.assessment.create({
      data: {
        title,
        type: type as any, // Cast to enum
        subjectId,
        maxMarks,
        weightage,
        dueDate,
        instructions,
        attachmentUrl,
        createdAt: new Date()
      },
      include: {
        subject: {
          include: {
            course: true
          }
        }
      }
    });
    
    return NextResponse.json({ 
      message: 'Assessment created successfully',
      assessment: {
        id: assessment.id,
        title: assessment.title,
        type: assessment.type,
        maxMarks: assessment.maxMarks,
        weightage: assessment.weightage,
        dueDate: assessment.dueDate,
        instructions: assessment.instructions,
        attachmentUrl: assessment.attachmentUrl,
        subjectName: assessment.subject.name,
        subjectCode: assessment.subject.code,
        courseName: assessment.subject.course.name
      }
    }, { status: 201 });
  } catch (error: any) {
    console.error('Assessment creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create assessment', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
