"use client";

import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout"; // This should exist
import StatCard from "@/components/dashboard/StatCard"; // Make sure this exists
import CourseList from "@/components/faculty/CourseList"; // Check if this exists
import UpcomingClasses from "@/components/faculty/UpcomingClasses"; // Check if this exists
import AttendanceSummary from "@/components/faculty/AttendanceSummary"; // Check if this exists

// Define proper types
interface DashboardCourse {
  id: string;
  code: string;
  name: string;
  studentsCount: number;
}

interface ClassSchedule {
  id: string;
  courseName: string;
  roomName: string;
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
  totalStudents: number;
  totalCourses: number;
  pendingAttendance: number;
  pendingGrades: number;
  courseList: DashboardCourse[];
  upcomingClasses: ClassSchedule[];
  attendanceSummary: Record<string, AttendanceStats>;
}

export default function FacultyDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [dashboardData, setDashboardData] = useState<FacultyDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const response = await fetch("/api/faculty/dashboard");
        
        if (!response.ok) {
          throw new Error("Failed to fetch faculty dashboard data");
        }
        
        const data = await response.json();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching faculty dashboard data:", error);
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
      <FacultyLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Faculty Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="My Students"
            value={dashboardData?.totalStudents || 0}
            icon="users"
            trend={0}
            color="blue"
          />
          <StatCard
            title="My Courses"
            value={dashboardData?.totalCourses || 0}
            icon="book-open"
            trend={0}
            color="purple"
          />
          <StatCard
            title="Pending Attendance"
            value={dashboardData?.pendingAttendance || 0}
            icon="clock"
            trend={0}
            color="yellow"
          />
          <StatCard
            title="Pending Grades"
            value={dashboardData?.pendingGrades || 0}
            icon="chart-bar"
            trend={0}
            color="green"
          />
        </div>

        {/* Course List & Upcoming Classes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Course List */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">My Courses</h2>
              <p className="mt-1 text-sm text-gray-500">
                List of courses you are teaching this semester
              </p>
            </div>
            <CourseList courses={dashboardData?.courseList || []} />
          </div>

          {/* Upcoming Classes */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Upcoming Classes</h2>
              <p className="mt-1 text-sm text-gray-500">
                Your scheduled classes for this week
              </p>
            </div>
            <div className="p-6">
              <UpcomingClasses classes={dashboardData?.upcomingClasses || []} />
            </div>
          </div>
        </div>

        {/* Attendance Summary */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Attendance Statistics</h2>
            <p className="mt-1 text-sm text-gray-500">
              Average attendance statistics by course
            </p>
          </div>
          <div className="p-6">
            <AttendanceSummary data={dashboardData?.attendanceSummary || {}} />
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}
