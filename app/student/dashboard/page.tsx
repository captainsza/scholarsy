"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import StatCard from "@/components/dashboard/StatCard";
import CourseCard from "@/components/student/CourseCard";
import AttendanceChart from "@/components/student/AttendanceChart";
import UpcomingAssignments from "@/components/student/UpcomingAssignments";
import GradeTable from "@/components/student/GradeTable";

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

export default function StudentDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<StudentDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch("/api/student/dashboard");
        
        if (!response.ok) {
          throw new Error("Failed to fetch student dashboard data");
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, user]);

  // Show loading state
  if (authLoading || loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Enrolled Courses"
            value={dashboardData?.enrolledCourses || 0}
            icon="book-open"
            trend={0}
            color="blue"
          />
          <StatCard
            title="Attendance"
            value={dashboardData?.attendancePercentage || 0}
            icon="clipboard-check"
            trend={0}
            color="green"
            suffix="%"
          />
          <StatCard
            title="Pending Assignments"
            value={dashboardData?.pendingAssignments || 0}
            icon="document-text"
            trend={0}
            color="yellow"
          />
          <StatCard
            title="Avg. Grade"
            value={dashboardData?.avgGrade || 0}
            icon="academic-cap"
            trend={0}
            color="indigo"
            suffix="/10"
          />
        </div>

        {/* My Courses */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">My Courses</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {dashboardData?.courses?.map(course => (
              <CourseCard key={course.id} course={course} />
            )) || <div className="col-span-3 text-center py-8 text-gray-500">No enrolled courses</div>}
          </div>
        </div>

        {/* Attendance & Assignments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Attendance Chart */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Attendance Summary</h2>
              <p className="mt-1 text-sm text-gray-500">
                Your attendance records for current courses
              </p>
            </div>
            <div className="p-6">
              <AttendanceChart data={dashboardData?.attendance || []} />
            </div>
          </div>

          {/* Upcoming Assignments */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Assignments</h2>
              <p className="mt-1 text-sm text-gray-500">
                Assignments due in the next week
              </p>
            </div>
            <div className="p-6">
              <UpcomingAssignments assignments={dashboardData?.assignments || []} />
            </div>
          </div>
        </div>

        {/* Grades */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Current Grades</h2>
            <p className="mt-1 text-sm text-gray-500">
              Your academic performance in current semester
            </p>
          </div>
          <div className="overflow-x-auto">
            <GradeTable grades={dashboardData?.grades || []} />
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
