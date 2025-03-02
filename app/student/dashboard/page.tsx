"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  BookOpen,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Calendar,
  AlertCircle
} from "lucide-react";

// Define proper types
interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  faculty: {
    name: string;
  };
}

interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
}

interface AttendanceSummary {
  courseName: string;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

interface Grade {
  courseCode: string;
  courseName: string;
  sessionalMark: number;
  attendanceMark: number;
  totalMark: number;
  grade: string;
}

interface StudentDashboardData {
  enrolledCourses: number;
  attendancePercentage: number;
  pendingAssignments: number;
  avgGrade: number;
  courses: Course[];
  attendance: AttendanceSummary[];
  assignments: Assignment[];
  grades: Grade[];
}

// StatCard component
function StatCard({ 
  title, 
  value, 
  icon, 
  color,
  suffix = ""
}: { 
  title: string;
  value: number;
  icon: "book-open" | "clipboard-check" | "document-text" | "academic-cap";
  color: "blue" | "green" | "yellow" | "indigo";
  suffix?: string;
}) {
  const getIcon = () => {
    const props = { className: "h-8 w-8" };
    
    switch(icon) {
      case "book-open": return <BookOpen {...props} />;
      case "clipboard-check": return <ClipboardCheck {...props} />;
      case "document-text": return <FileText {...props} />;
      case "academic-cap": return <GraduationCap {...props} />;
    }
  };
  
  const getColorClass = () => {
    switch(color) {
      case "blue": return "bg-blue-50 text-blue-600";
      case "green": return "bg-green-50 text-green-600";
      case "yellow": return "bg-amber-50 text-amber-600";
      case "indigo": return "bg-indigo-50 text-indigo-600";
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold">
            {value}
            <span className="text-lg ml-1 font-normal text-gray-500">{suffix}</span>
          </h3>
        </div>
        <div className={`p-3 rounded-full ${getColorClass()}`}>
          {getIcon()}
        </div>
      </CardContent>
    </Card>
  );
}

// CourseCard component
function CourseCard({ course }: { course: Course }) {
  return (
    <Card className="overflow-hidden h-full">
      <div className={`bg-blue-500 h-2 w-full`}></div>
      <CardContent className="p-6 h-full flex flex-col">
        <div className="mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
            {course.code}
          </span>
        </div>
        <h3 className="font-medium text-lg text-gray-900 mb-2">{course.name}</h3>
        <div className="text-gray-500 text-sm mb-4 flex-grow">
          <div>Credits: {course.credits}</div>
          <div>Faculty: {course.faculty?.name || 'Not assigned'}</div>
        </div>
        <button className="text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center">
          View Subject Details
          <svg className="ml-1 w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </CardContent>
    </Card>
  );
}

// AttendanceChart component 
function AttendanceChart({ data }: { data: AttendanceSummary[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500">
        <ClipboardCheck className="h-12 w-12 text-gray-400 mb-2" />
        <p>No attendance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((item, index) => (
        <div key={index} className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="text-sm font-medium">{item.courseName}</div>
            <div className="text-sm font-medium text-green-600">{item.percentage}%</div>
          </div>
          <div className="space-y-1">
            <Progress value={item.percentage} className="h-2 bg-gray-100" />
            <div className="flex justify-between text-xs text-gray-500">
              <div>Present: {item.present}</div>
              <div>Absent: {item.absent}</div>
              <div>Late: {item.late}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// UpcomingAssignments component
function UpcomingAssignments({ assignments }: { assignments: Assignment[] }) {
  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500">
        <FileText className="h-12 w-12 text-gray-400 mb-2" />
        <p>No upcoming assignments</p>
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    submitted: "bg-blue-100 text-blue-800",
    graded: "bg-green-100 text-green-800"
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {assignments.map((assignment) => (
        <div key={assignment.id} className="p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between">
            <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${statusColors[assignment.status]}`}>
              {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
            </span>
          </div>
          <div className="mt-1 text-xs text-gray-500">{assignment.courseCode} - {assignment.courseName}</div>
          <div className="mt-2 text-xs font-medium">Due: {formatDate(assignment.dueDate)}</div>
        </div>
      ))}
    </div>
  );
}

// GradeTable component
function GradeTable({ grades }: { grades: Grade[] }) {
  if (grades.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500">
        <GraduationCap className="h-12 w-12 text-gray-400 mb-2" />
        <p>No grade data available</p>
      </div>
    );
  }

  const getGradeColor = (grade: string) => {
    const gradeMap: Record<string, string> = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800',
    };
    
    return gradeMap[grade] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Course
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Sessional
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Attendance
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total
          </th>
          <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
            Grade
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {grades.map((grade, index) => (
          <tr key={`${grade.courseCode}-${index}`}>
            <td className="px-6 py-4 whitespace-nowrap">
              <div className="font-medium text-gray-900">{grade.courseCode}</div>
              <div className="text-sm text-gray-500">{grade.courseName}</div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
              {grade.sessionalMark}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
              {grade.attendanceMark}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
              {grade.totalMark}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getGradeColor(grade.grade)}`}>
                {grade.grade}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/student/dashboard");
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status} - ${await response.text()}`);
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
        setError("Failed to load dashboard data. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchDashboardData();
    } else if (!authLoading && !user) {
      setError("Authentication required");
      setLoading(false);
    }
  }, [authLoading, user]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </StudentLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <StudentLayout>
        <div className="p-8 max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh page
          </button>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
          {user?.student && (
            <p className="text-gray-600">
              Welcome back, {user.profile?.firstName} | Enrollment ID: {user.student.enrollmentId}
            </p>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Enrolled Courses"
            value={dashboardData?.enrolledCourses || 0}
            icon="book-open"
            color="blue"
          />
          <StatCard
            title="Attendance"
            value={dashboardData?.attendancePercentage || 0}
            icon="clipboard-check"
            color="green"
            suffix="%"
          />
          <StatCard
            title="Pending Assignments"
            value={dashboardData?.pendingAssignments || 0}
            icon="document-text"
            color="yellow"
          />
          <StatCard
            title="Avg. Grade Point"
            value={dashboardData?.avgGrade || 0}
            icon="academic-cap"
            color="indigo"
          />
        </div>

        {/* My Courses */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>My Courses</CardTitle>
            <CardDescription>Your enrolled courses for the current semester</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboardData?.courses && dashboardData.courses.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {dashboardData.courses.map(course => (
                  <CourseCard key={course.id} course={course} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500">
                <BookOpen className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                <p>No enrolled courses</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance & Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attendance Chart */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Attendance Summary</CardTitle>
              <CardDescription>Your attendance records for current courses</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <AttendanceChart data={dashboardData?.attendance || []} />
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Upcoming Assignments</CardTitle>
              <CardDescription>Assignments due in the next week</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <UpcomingAssignments assignments={dashboardData?.assignments || []} />
            </CardContent>
          </Card>
        </div>

        {/* Grades */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Current Grades</CardTitle>
            <CardDescription>Your academic performance in current semester</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <GradeTable grades={dashboardData?.grades || []} />
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
