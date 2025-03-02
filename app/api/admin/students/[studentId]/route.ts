import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET: Get a specific student by ID
export async function GET(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;

    // Fetch the student with related data
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        sectionEnrollments: {
          include: {
            section: {
              include: {
                course: true,
              },
            },
          },
          take: 5, // Limit to most recent 5 enrollments for preview
          orderBy: {
            enrolledAt: 'desc',
          },
        },
        // Include other related data that might be useful
        _count: {
          select: {
            sectionEnrollments: true,
            gradeRecords: true,
            attendance: true,
          },
        },
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    // Calculate additional statistics if needed
    const activeEnrollmentsCount = await prisma.sectionEnrollment.count({
      where: {
        studentId,
        status: "ACTIVE",
      },
    });

    // Return the student data
    return NextResponse.json({
      student,
      stats: {
        activeEnrollments: activeEnrollmentsCount,
      },
    });
  } catch (error) {
    console.error("Failed to fetch student:", error);
    return NextResponse.json(
      { message: "Failed to fetch student details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// PUT: Update student details
export async function PUT(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;
    const updateData = await req.json();

    // Check if the student exists
    const existingStudent = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!existingStudent) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    // Extract data for different models
    const {
      // User profile data
      firstName, lastName, email, phone, profileImage,
      // Student-specific data
      department, enrollmentId, gender, dob, bloodGroup,
      fatherName, motherName, admissionSession, admissionSemester,
      academicStatus, instituteCode, instituteName, courseName,
      branchName, currentSemester, address, city, state, country, pincode,
      // Any other data...
      ...restData
    } = updateData;

    // Start a transaction to update multiple related records
    const updatedStudent = await prisma.$transaction(async (tx) => {
      // Update student record
      const student = await tx.student.update({
        where: { id: studentId },
        data: {
          department: department,
          enrollmentId: enrollmentId,
          gender: gender,
          dob: dob ? new Date(dob) : undefined,
          bloodGroup: bloodGroup,
          fatherName: fatherName,
          motherName: motherName,
          admissionSession: admissionSession,
          admissionSemester: admissionSemester,
          academicStatus: academicStatus,
          instituteCode: instituteCode,
          instituteName: instituteName,
          courseName: courseName,
          branchName: branchName,
          currentSemester: currentSemester,
          address: address,
          city: city,
          state: state,
          country: country,
          pincode: pincode,
        },
        include: {
          user: true,
        },
      });

      // Update profile if profile data is provided
      if (firstName || lastName || phone || profileImage) {
        await tx.profile.update({
          where: { userId: student.userId },
          data: {
            firstName: firstName,
            lastName: lastName,
            phone: phone,
            profileImage: profileImage,
          },
        });
      }

      // Update email if provided
      if (email) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            email: email,
          },
        });
      }

      return student;
    });

    // Fetch the updated student with full relations for response
    const fullUpdatedStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    return NextResponse.json({
      message: "Student updated successfully",
      student: fullUpdatedStudent,
    });
  } catch (error) {
    console.error("Failed to update student:", error);
    return NextResponse.json(
      { message: "Failed to update student details" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// DELETE: Delete a student
export async function DELETE(
  req: NextRequest,
  { params }: { params: { studentId: string } }
) {
  try {
    const { studentId } = params;

    // Check if the student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        user: true,
      },
    });

    if (!student) {
      return NextResponse.json(
        { message: "Student not found" },
        { status: 404 }
      );
    }

    // To properly delete a student, we need to delete in a transaction
    // to handle all related records and foreign key constraints
    await prisma.$transaction(async (tx) => {
      // First delete all related records that reference the student
      await tx.sectionEnrollment.deleteMany({
        where: { studentId },
      });
      
      await tx.subjectAttendance.deleteMany({
        where: { studentId },
      });
      
      await tx.assessmentMark.deleteMany({
        where: { studentId },
      });
      
      await tx.attendance.deleteMany({
        where: { studentId },
      });
      
      await tx.gradeRecord.deleteMany({
        where: { studentId },
      });
      
      await tx.submission.deleteMany({
        where: { studentId },
      });
      
      await tx.registration.deleteMany({
        where: { studentId },
      });

      // Delete the student record
      await tx.student.delete({
        where: { id: studentId },
      });

      // Delete the profile
      await tx.profile.delete({
        where: { userId: student.userId },
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: student.userId },
      });
    });

    return NextResponse.json({
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Failed to delete student:", error);
    return NextResponse.json(
      { message: "Failed to delete student" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
