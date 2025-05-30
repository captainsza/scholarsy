import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

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
    
    // Check role-based access
    if (!['ADMIN', 'FACULTY'].includes(decoded.role)) {
      return NextResponse.json({ message: 'Insufficient permissions' }, { status: 403 });
    }
    
    // Get query parameters
    const searchParams = req.nextUrl.searchParams;
    const departmentFilter = searchParams.get('department');
    const courseFilter = searchParams.get('course');
    const subjectFilter = searchParams.get('subject');
    const statusFilter = searchParams.get('status');
    const workloadFilter = searchParams.get('workload');
    const sortOption = searchParams.get('sort') || 'name_asc';
    const searchQuery = searchParams.get('search') || '';
    
    // Base query
    const where: any = {};
    
    // Apply department filter
    if (departmentFilter && departmentFilter !== 'all') {
      where.department = departmentFilter;
    }
    
    // Apply search query
    if (searchQuery) {
      where.OR = [
        { department: { contains: searchQuery, mode: 'insensitive' } },
        { 
          user: { 
            email: { contains: searchQuery, mode: 'insensitive' } 
          } 
        },
        { 
          user: { 
            profile: { 
              OR: [
                { firstName: { contains: searchQuery, mode: 'insensitive' } },
                { lastName: { contains: searchQuery, mode: 'insensitive' } }
              ]
            } 
          } 
        }
      ];
    }
    
    // Build orderBy based on sort option
    let orderBy: any = {};
    
    switch (sortOption) {
      case 'name_asc':
        orderBy = {
          user: {
            profile: {
              firstName: 'asc'
            }
          }
        };
        break;
      case 'name_desc':
        orderBy = {
          user: {
            profile: {
              firstName: 'desc'
            }
          }
        };
        break;
      case 'department_asc':
        orderBy = { department: 'asc' };
        break;
      case 'department_desc':
        orderBy = { department: 'desc' };
        break;
      case 'newest':
        orderBy = { user: { createdAt: 'desc' } };
        break;
      case 'oldest':
        orderBy = { user: { createdAt: 'asc' } };
        break;
      default:
        orderBy = {
          user: {
            profile: {
              firstName: 'asc'
            }
          }
        };
    }
    
    // Get faculty list with related data
    const facultyList = await prisma.faculty.findMany({
      where,
      include: {
        user: {
          include: {
            profile: true
          }
        },
        courses: {
          select: {
            id: true,
            name: true,
            branch: true,
            year: true,
            semester: true,
            _count: {
              select: {
                enrollments: true
              }
            }
          }
        },
        subjects: {
          select: {
            id: true,
            name: true,
            code: true,
            creditHours: true,
            course: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        workload: true,
        _count: {
          select: {
            subjects: true,
            courses: true
          }
        }
      },
      orderBy
    });
    
    // Apply additional filters that require post-processing
    let filteredFacultyList = facultyList;
    
    // Filter by course
    if (courseFilter && courseFilter !== 'all') {
      filteredFacultyList = filteredFacultyList.filter(faculty => 
        faculty.courses.some(course => course.id === courseFilter)
      );
    }
    
    // Filter by subject
    if (subjectFilter && subjectFilter !== 'all') {
      filteredFacultyList = filteredFacultyList.filter(faculty => 
        faculty.subjects.some(subject => subject.id === subjectFilter)
      );
    }
    
    // Filter by status (based on user approval)
    if (statusFilter && statusFilter !== 'all') {
      filteredFacultyList = filteredFacultyList.filter(faculty => {
        if (statusFilter === 'approved') return faculty.user.isApproved;
        if (statusFilter === 'pending') return !faculty.user.isApproved;
        if (statusFilter === 'verified') return faculty.user.emailVerified;
        if (statusFilter === 'unverified') return !faculty.user.emailVerified;
        return true;
      });
    }
    
    // Filter by workload
    if (workloadFilter && workloadFilter !== 'all') {
      filteredFacultyList = filteredFacultyList.filter(faculty => {
        const subjectCount = faculty._count.subjects;
        
        switch (workloadFilter) {
          case 'low':
            return subjectCount >= 0 && subjectCount <= 3;
          case 'medium':
            return subjectCount >= 4 && subjectCount <= 6;
          case 'high':
            return subjectCount >= 7;
          default:
            return true;
        }
      });
    }
    
    // Apply workload-based sorting if needed
    if (sortOption === 'workload_asc' || sortOption === 'workload_desc') {
      filteredFacultyList.sort((a, b) => {
        const aWorkload = a._count.subjects;
        const bWorkload = b._count.subjects;
        
        return sortOption === 'workload_asc' 
          ? aWorkload - bWorkload 
          : bWorkload - aWorkload;
      });
    }
    
    // Transform for frontend - exclude sensitive data and add computed fields
    const faculty = filteredFacultyList.map(f => {
      const totalStudents = f.courses.reduce((sum, course) => sum + course._count.enrollments, 0);
      
      return {
        id: f.id,
        name: f.user.profile 
          ? `${f.user.profile.firstName} ${f.user.profile.lastName}` 
          : `Faculty ID: ${f.id}`,
        email: f.user.email,
        department: f.department,
        user: f.user,
        courses: f.courses,
        subjects: f.subjects,
        subjectCount: f._count.subjects,
        courseCount: f._count.courses,
        totalStudents,
        workload: f.workload
      };
    });
    
    return NextResponse.json({ faculty });
  } catch (error: any) {
    console.error('Faculty fetch error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch faculty list', error: error.message }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

// POST to create a new faculty member
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
    
    if (decoded.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Admin access required' }, { status: 403 });
    }
    
    const { userId, department } = await req.json();
    
    if (!userId || !department) {
      return NextResponse.json(
        { message: 'User ID and department are required' }, 
        { status: 400 }
      );
    }
    
    // Check if user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!userExists) {
      return NextResponse.json(
        { message: 'User not found' }, 
        { status: 404 }
      );
    }
    
    // Check if faculty record already exists for this user
    const existingFaculty = await prisma.faculty.findUnique({
      where: { userId },
    });
    
    if (existingFaculty) {
      return NextResponse.json(
        { message: 'Faculty record already exists for this user' }, 
        { status: 400 }
      );
    }
    
    // Create the faculty record
    const faculty = await prisma.faculty.create({
      data: {
        userId,
        department,
      },
      include: {
        user: {
          include: {
            profile: true
          }
        }
      }
    });
    
    return NextResponse.json(faculty);
  } catch (error: any) {
    console.error('Faculty creation error:', error);
    return NextResponse.json(
      { message: 'Failed to create faculty' }, 
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
