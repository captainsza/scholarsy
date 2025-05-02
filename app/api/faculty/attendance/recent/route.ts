import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const token = (await cookies()).get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key'
    ) as { id: string, role: string };
    
    if (decoded.role !== 'FACULTY') {
      return NextResponse.json({ message: 'Faculty access required' }, { status: 403 });
    }
    
    const facultyId = req.nextUrl.searchParams.get('facultyId');
    
    if (!facultyId) {
      return NextResponse.json({ message: 'Faculty ID is required' }, { status: 400 });
    }

    // Get subjects taught by this faculty
    const subjects = await prisma.subject.findMany({
      where: { facultyId },
      select: { id: true }
    });
    
    const subjectIds = subjects.map(s => s.id);
    
    if (subjectIds.length === 0) {
      return NextResponse.json({
        records: [],
        statistics: {
          total: 0,
          present: 0,
          absent: 0,
          late: 0
        }
      });
    }

    // Get recent attendance records (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    // Group attendance by date and subject for summary records
    const attendanceRecords = await prisma.subjectAttendance.groupBy({
      by: ['subjectId', 'date'],
      where: {
        subjectId: { in: subjectIds },
        date: { gte: thirtyDaysAgo }
      },
      _count: {
        studentId: true
      }
    });
    
    // Get subject details to populate names
    const subjectDetails = await prisma.subject.findMany({
      where: { id: { in: subjectIds } },
      include: { course: true }
    });
    
    // Create a map for quick lookup
    const subjectMap = subjectDetails.reduce((map, subject) => {
      map[subject.id] = {
        name: subject.name,
        code: subject.code,
        courseName: subject.course?.name || 'Unknown Course'
      };
      return map;
    }, {} as Record<string, { name: string, code: string, courseName: string }>);
    
    // Get overall attendance statistics
    const attendanceStats = await prisma.subjectAttendance.groupBy({
      by: ['status'],
      where: {
        subjectId: { in: subjectIds }
      },
      _count: {
        id: true
      }
    });
    
    // Transform statistics data
    const statistics = {
      total: attendanceStats.reduce((sum, stat) => sum + stat._count.id, 0),
      present: attendanceStats.find(s => s.status === 'PRESENT')?._count.id || 0,
      absent: attendanceStats.find(s => s.status === 'ABSENT')?._count.id || 0,
      late: attendanceStats.find(s => s.status === 'LATE')?._count.id || 0
    };

    // Transform the attendance records
    const records = attendanceRecords.map(record => {
      const subjectInfo = subjectMap[record.subjectId] || { 
        name: 'Unknown Subject',
        code: 'N/A',
        courseName: 'Unknown Course'
      };
      
      return {
        id: `${record.subjectId}-${record.date.toISOString().split('T')[0]}`,
        date: record.date.toISOString().split('T')[0],
        formattedDate: record.date.toLocaleDateString('en-US', {
          year: 'numeric', 
          month: 'short', 
          day: 'numeric'
        }),
        subjectId: record.subjectId,
        subjectName: subjectInfo.name,
        subjectCode: subjectInfo.code,
        courseName: subjectInfo.courseName,
        studentsCount: record._count.studentId
      };
    });
    
    // Sort records by date (newest first)
    records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      records,
      statistics
    });
    
  } catch (error: any) {
    console.error('Recent attendance fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch recent attendance data', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
