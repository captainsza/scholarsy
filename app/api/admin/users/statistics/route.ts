import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET() {
  try {
    // Get total users count
    const totalUsers = await prisma.user.count();
    
    // Get count by role
    const students = await prisma.user.count({
      where: { role: "STUDENT" }
    });
    
    const faculty = await prisma.user.count({
      where: { role: "FACULTY" }
    });
    
    const admins = await prisma.user.count({
      where: { role: "ADMIN" }
    });
    
    // Get pending approval count
    const pending = await prisma.user.count({
      where: { isApproved: false }
    });
    
    // Get recent registrations (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentRegistrations = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });

    return NextResponse.json({
      total: totalUsers,
      students,
      faculty,
      admins,
      pending,
      recentRegistrations
    });
  } catch (error) {
    console.error("Failed to fetch user statistics:", error);
    return NextResponse.json(
      { message: "Failed to fetch user statistics" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
