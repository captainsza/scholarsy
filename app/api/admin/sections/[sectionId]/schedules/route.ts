import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get all schedules for a section
export async function GET(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const { sectionId } = params;
    
    const schedules = await prisma.classSchedule.findMany({
      where: { sectionId },
      include: {
        room: true
      },
      orderBy: [
        {
          dayOfWeek: 'asc'
        },
        {
          startTime: 'asc'
        }
      ]
    });

    return NextResponse.json({ schedules });
  } catch (error) {
    console.error("Failed to fetch schedules:", error);
    return NextResponse.json(
      { message: "Failed to fetch schedules" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// Create a new schedule for a section
export async function POST(req: NextRequest, { params }: { params: { sectionId: string } }) {
  try {
    const { sectionId } = params;
    const { dayOfWeek, startTime, endTime, roomId } = await req.json();

    // Validate required fields
    if (!dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if section exists
    const section = await prisma.courseSection.findUnique({
      where: { id: sectionId }
    });

    if (!section) {
      return NextResponse.json(
        { message: "Section not found" },
        { status: 404 }
      );
    }

    // Check for scheduling conflicts if room is specified
    if (roomId) {
      const conflicts = await prisma.classSchedule.findFirst({
        where: {
          roomId,
          dayOfWeek,
          OR: [
            {
              AND: [
                { startTime: { lte: startTime } },
                { endTime: { gt: startTime } }
              ]
            },
            {
              AND: [
                { startTime: { lt: endTime } },
                { endTime: { gte: endTime } }
              ]
            },
            {
              AND: [
                { startTime: { gte: startTime } },
                { endTime: { lte: endTime } }
              ]
            }
          ]
        }
      });

      if (conflicts) {
        return NextResponse.json(
          { message: "Room is already scheduled during this time slot" },
          { status: 409 }
        );
      }
    }

    // Create the schedule
    const schedule = await prisma.classSchedule.create({
      data: {
        sectionId,
        dayOfWeek,
        startTime,
        endTime,
        roomId: roomId || null
      },
      include: {
        room: true
      }
    });

    return NextResponse.json(
      { message: "Schedule created successfully", schedule },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create schedule:", error);
    return NextResponse.json(
      { message: "Failed to create schedule" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
