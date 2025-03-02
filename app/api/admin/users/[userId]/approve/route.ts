import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendApprovalEmail } from "@/utils/email";

const prisma = new PrismaClient();

// Update a user's approval status
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    const { isApproved } = await req.json();
    
    // Check if the isApproved field is provided
    if (isApproved === undefined) {
      return NextResponse.json(
        { message: "isApproved field is required" },
        { status: 400 }
      );
    }
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }
    
    // Update user approval status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isApproved }
    });
    
    // Send email notification to user
    try {
      await sendApprovalEmail(existingUser.email, isApproved);
    } catch (emailError) {
      console.error("Failed to send approval email:", emailError);
      // Continue with the response even if email fails
    }
    
    return NextResponse.json({
      message: `User ${isApproved ? 'approved' : 'disapproved'} successfully`,
      isApproved
    });
  } catch (error) {
    console.error("Failed to update user approval status:", error);
    return NextResponse.json(
      { message: "Failed to update approval status" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
