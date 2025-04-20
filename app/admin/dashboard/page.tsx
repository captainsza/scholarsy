"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layouts/AdminLayout";
import StatCard from "@/components/dashboard/StatCard";
import ApprovalTable from "@/components/admin/ApprovalTable";
import RecentActivityFeed from "@/components/dashboard/RecentActivityFeed";

// Summary statistics types
type DashboardStats = {
  totalStudents: number;
  totalFaculty: number;
  pendingApprovals: number;
  totalCourses: number;
  studentsByDepartment: Record<string, number>;
  facultyByDepartment: Record<string, number>;
  recentActivity: Array<{
    id: string;
    type: string;
    user: string;
    action: string;
    timestamp: string;
  }>;
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/dashboard");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error("Failed to fetch dashboard data");
        }
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchDashboardData();
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Students"
            value={stats?.totalStudents || 0}
            icon="users"
            trend={5}
            color="blue"
          />
          <StatCard
            title="Total Faculty"
            value={stats?.totalFaculty || 0}
            icon="academic-cap"
            trend={2}
            color="green"
          />
          <StatCard
            title="Pending Approvals"
            value={stats?.pendingApprovals || 0}
            icon="clock"
            trend={0}
            color="yellow"
          />
          <StatCard
            title="Courses"
            value={stats?.totalCourses || 0}
            icon="book-open"
            trend={3}
            color="indigo"
          />
        </div>

        {/* Approval Section & Department Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Pending Approvals */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Pending Approvals</h2>
              <p className="mt-1 text-sm text-gray-500">
                Review and approve new user registrations
              </p>
            </div>
            <ApprovalTable />
          </div>

       
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <p className="mt-1 text-sm text-gray-500">
              Latest actions and events in the system
            </p>
          </div>
          <div className="px-6 py-5">
            <RecentActivityFeed activities={stats?.recentActivity || []} />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
