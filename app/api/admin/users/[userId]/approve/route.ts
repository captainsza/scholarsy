import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { sendApprovalEmail } from "@/utils/email";

const prisma = new PrismaClient();

// Update a user's approval status
export async function PATCH(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;
    
    // Try to parse body if available, default to approving the user
    let isApproved = true;
    try {
      const body = await req.json();
      if (body && body.isApproved !== undefined) {
        isApproved = body.isApproved;
      }
    } catch (e) {
      // If no body or parsing fails, continue with default value
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
