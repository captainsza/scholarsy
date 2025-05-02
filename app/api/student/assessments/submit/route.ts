import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { uploadToCloudinary } from '@/utils/cloudinary_assetmnt';

const prisma = new PrismaClient();

// POST: Submit an assignment
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
    
    if (decoded.role !== 'STUDENT') {
      return NextResponse.json({ message: 'Student access required' }, { status: 403 });
    }
    
    // Get student record
    const student = await prisma.student.findFirst({
      where: { userId: decoded.id }
    });
    
    if (!student) {
      return NextResponse.json({ message: 'Student record not found' }, { status: 404 });
    }
    
    // Parse form data
    const formData = await req.formData();
    const assessmentId = formData.get('assessmentId') as string;
    const comments = formData.get('comments') as string;
    const submissionFile = formData.get('submissionFile') as File;
    
    if (!assessmentId) {
      return NextResponse.json({ message: 'Assessment ID is required' }, { status: 400 });
    }
    
    // Check if assessment exists and is still open
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { subject: true }
    });
    
    if (!assessment) {
      return NextResponse.json({ message: 'Assessment not found' }, { status: 404 });
    }
    
    // Check if the due date has passed
    if (assessment.dueDate && new Date() > new Date(assessment.dueDate)) {
      return NextResponse.json({ message: 'Assessment submission deadline has passed' }, { status: 400 });
    }
    
    // Check if student is enrolled in the course for this subject
    const enrollment = await prisma.courseEnrollment.findFirst({
      where: {
        studentId: student.id,
        courseId: assessment.subject.courseId,
        status: 'ACTIVE'
      }
    });
    
    if (!enrollment) {
      return NextResponse.json(
        { message: 'You are not enrolled in this course' },
        { status: 403 }
      );
    }
    
    // Check if student has already submitted this assessment
    const existingSubmission = await prisma.assessmentMark.findFirst({
      where: {
        assessmentId,
        studentId: student.id,
        submittedAt: { not: null }
      }
    });
    
    // Upload file to Cloudinary if provided
    let fileUrl = null;
    if (submissionFile) {
      const arrayBuffer = await submissionFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      // Convert buffer to base64 string for Cloudinary
      const base64String = buffer.toString('base64');
      const dataURI = `data:${submissionFile.type};base64,${base64String}`;
      
      // Upload to Cloudinary
      const result = await uploadToCloudinary(
        dataURI,
        `submission_${student.enrollmentId}_${Date.now()}`
      );
      
      fileUrl = result.secure_url;
    } else if (!existingSubmission) {
      // Only require file for new submissions
      return NextResponse.json({ message: 'Submission file is required' }, { status: 400 });
    }
    
    let submission;
    
    if (existingSubmission) {
      // Update existing submission
      submission = await prisma.assessmentMark.update({
        where: { id: existingSubmission.id },
        data: {
          submittedAt: new Date(),
          ...(comments && { feedback: comments }), // Store student comments as feedback
          ...(fileUrl && { fileUrl }) // Update file URL if provided
        }
      });
    } else {
      // Create new submission
      submission = await prisma.assessmentMark.create({
        data: {
          assessmentId,
          studentId: student.id,
          marksObtained: 0, // Initial marks as 0
          submittedAt: new Date(),
          feedback: comments,
          fileUrl
        }
      });
    }
    
    return NextResponse.json({
      message: existingSubmission ? 'Assignment re-submitted successfully' : 'Assignment submitted successfully',
      submission: {
        id: submission.id,
        submittedAt: submission.submittedAt,
        fileUrl: submission.fileUrl
      }
    });
  } catch (error: any) {
    console.error('Assignment submission error:', error);
    return NextResponse.json(
      { message: 'Failed to submit assignment', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
