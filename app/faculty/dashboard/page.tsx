"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Calendar,
  AlertCircle,
  Group
} from "lucide-react";

// Define proper types
interface DashboardCourse {
  id: string;
  code: string;
  name: string;
  section?: string;
  course?: string;
  studentsCount: number;
}

interface ClassSchedule {
  id: string;
  courseName: string;
  roomName: string;
  sectionName?: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  late: number;
}

interface FacultyDashboardData {
  facultyName: string;
  department: string;
  totalStudents: number;
  totalCourses: number;
  pendingAttendance: number;
  pendingGrades: number;
  courseList: DashboardCourse[];
  upcomingClasses: ClassSchedule[];
  attendanceSummary: Record<string, AttendanceStats>;
  recentActivity?: {
    subjectCount: number;
    courseCount: number;
    assessmentCount: number;
  };
}

// StatCard component
function StatCard({ 
  title, 
  value, 
  icon, 
  color
}: { 
  title: string, 
  value: number, 
  icon: "users" | "book-open" | "clock" | "chart-bar", 
  color: "blue" | "purple" | "yellow" | "green" 
}) {
  const getIcon = () => {
    const props = { className: "h-8 w-8" };
    
    switch(icon) {
      case "users": return <Group {...props} />;
      case "book-open": return <BookOpen {...props} />;
      case "clock": return <ClipboardList {...props} />;
      case "chart-bar": return <GraduationCap {...props} />;
    }
  };
  
  const getColorClass = () => {
    switch(color) {
      case "blue": return "bg-blue-50 text-blue-600";
      case "purple": return "bg-purple-50 text-purple-600";
      case "yellow": return "bg-amber-50 text-amber-600";
      case "green": return "bg-green-50 text-green-600";
    }
  };
  
  return (
    <Card>
      <CardContent className="p-6 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <h3 className="text-3xl font-bold">{value}</h3>
        </div>
        <div className={`p-3 rounded-full ${getColorClass()}`}>
          {getIcon()}
        </div>
      </CardContent>
    </Card>
  );
}

// CourseList component
function CourseList({ courses }: { courses: DashboardCourse[] }) {
  if (courses.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        No courses assigned yet.
      </div>
    );
  }
  
  return (
    <div className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Course Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Section
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Students
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {courses.map((course) => (
              <tr key={course.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {course.code}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {course.section || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {course.studentsCount} students
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// UpcomingClasses component
function UpcomingClasses({ classes }: { classes: ClassSchedule[] }) {
  if (classes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500">
        <Calendar className="h-12 w-12 text-gray-400 mb-2" />
        <p>No upcoming classes scheduled</p>
      </div>
    );
  }
  
  // Helper function to format time
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    } catch (error) {
      return time;
    }
  };
  
  // Helper function to get background color class based on day of week
  const getDayColor = (day: string) => {
    switch (day.toLowerCase()) {
      case 'monday': return 'bg-blue-50';
      case 'tuesday': return 'bg-green-50';
      case 'wednesday': return 'bg-purple-50';
      case 'thursday': return 'bg-amber-50';
      case 'friday': return 'bg-pink-50';
      case 'saturday': return 'bg-indigo-50';
      case 'sunday': return 'bg-gray-50';
      default: return 'bg-gray-50';
    }
  };
  
  return (
    <div className="divide-y divide-gray-200">
      {classes.map((cls) => (
        <div key={cls.id} className={`p-4 ${getDayColor(cls.dayOfWeek)}`}>
          <div className="flex justify-between items-center mb-1">
            <h3 className="font-medium text-gray-900">{cls.courseName}</h3>
            <span className="text-sm text-gray-700 font-medium">{cls.dayOfWeek}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <div>
              <p className="mb-1">{cls.roomName}</p>
              {cls.sectionName && <p className="text-xs">{cls.sectionName}</p>}
            </div>
            <div className="text-right">
              <span className="font-medium">
                {formatTime(cls.startTime)} - {formatTime(cls.endTime)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// AttendanceSummary component
function AttendanceSummary({ data }: { data: Record<string, AttendanceStats> }) {
  if (Object.keys(data).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-6 text-gray-500">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-2" />
        <p>No attendance data available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Object.entries(data).map(([courseName, stats]) => {
        const total = stats.present + stats.absent + stats.late;
        const presentPercentage = total > 0 ? (stats.present / total) * 100 : 0;
        const absentPercentage = total > 0 ? (stats.absent / total) * 100 : 0;
        const latePercentage = total > 0 ? (stats.late / total) * 100 : 0;
        
        return (
          <Card key={courseName} className="overflow-hidden">
            <CardHeader className="bg-gray-50 py-3">
              <CardTitle className="text-sm font-medium truncate">{courseName}</CardTitle>
            </CardHeader>
            <CardContent className="py-4">
              <div className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600 font-medium">Present ({stats.present})</span>
                    <span>{presentPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={presentPercentage} className="h-2 bg-gray-100 [&>div]:bg-green-500" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600 font-medium">Absent ({stats.absent})</span>
                    <span>{absentPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={absentPercentage} className="h-2 bg-gray-100 [&>div]:bg-red-500" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-amber-600 font-medium">Late ({stats.late})</span>
                    <span>{latePercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={latePercentage} className="h-2 bg-gray-100 [&>div]:bg-amber-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function FacultyDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Better error handling for the API call
        const response = await fetch("/api/faculty/dashboard", {
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error (${response.status}):`, errorText);
          throw new Error(`Failed to load dashboard data (${response.status})`);
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching faculty dashboard data:", error);
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
      <FacultyLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </FacultyLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <FacultyLayout>
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
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Faculty Dashboard</h1>
          {dashboardData?.facultyName && (
            <p className="text-gray-600">Welcome, {dashboardData.facultyName} | {dashboardData.department}</p>
          )}
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="My Students"
            value={dashboardData?.totalStudents || 0}
            icon="users"
            color="blue"
          />
          <StatCard
            title="My Courses"
            value={dashboardData?.totalCourses || 0}
            icon="book-open"
            color="purple"
          />
          <StatCard
            title="Pending Attendance"
            value={dashboardData?.pendingAttendance || 0}
            icon="clock"
            color="yellow"
          />
          <StatCard
            title="Pending Grades"
            value={dashboardData?.pendingGrades || 0}
            icon="chart-bar"
            color="green"
          />
        </div>

        {/* Course List & Upcoming Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Course List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>My Courses</CardTitle>
                <CardDescription>
                  List of courses you are teaching this semester
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <CourseList courses={dashboardData?.courseList || []} />
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Classes */}
          <div>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Upcoming Classes</CardTitle>
                <CardDescription>
                  Your scheduled classes for this week
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <UpcomingClasses classes={dashboardData?.upcomingClasses || []} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Attendance Summary */}
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle>Attendance Statistics</CardTitle>
            <CardDescription>
              Average attendance statistics by course
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <AttendanceSummary data={dashboardData?.attendanceSummary || {}} />
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
