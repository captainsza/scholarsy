"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import FacultyList from "@/components/admin/faculty/FacultyList";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Plus, Download, Upload, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";

export default function AdminFacultyPage() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/faculty');

        if (!response.ok) {
          throw new Error('Failed to fetch faculty');
        }

        const data = await response.json();
        setFaculty(data.faculty);

        // Extract unique departments and fix type issue
        const uniqueDepartments = [...new Set(data.faculty.map((member: any) => member.department))] as string[];
        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error('Error fetching faculty:', error);
        toast({
          title: "Error",
          description: "Failed to load faculty. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFaculty();
  }, []);

  const handleAddFaculty = () => {
    router.push('/admin/faculty/create');
  };

  // Filter faculty based on search query and department filter
  const filteredFaculty = faculty.filter((member: any) => {
    // Department filter
    if (departmentFilter !== "all" && member.department !== departmentFilter) {
      return false;
    }

    // Search query
    const query = searchQuery.toLowerCase();
    return (
      member.user?.profile?.firstName?.toLowerCase().includes(query) ||
      member.user?.profile?.lastName?.toLowerCase().includes(query) ||
      member.department?.toLowerCase().includes(query)
    );
  });

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage faculty, teaching assignments, and departmental organization
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {}}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {}}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              onClick={handleAddFaculty}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Faculty
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Faculty Directory</CardTitle>
            <CardDescription>
              View and manage all faculty members in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Input
                  placeholder="Search by name, department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <div className="absolute left-3 top-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                </div>
              </div>
              <div className="w-full md:w-64">
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Filter by department" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map((dept) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner message="Loading faculty members..." />
              </div>
            ) : (
              <FacultyList
                faculty={filteredFaculty}
                onView={(id) => router.push(`/admin/faculty/${id}`)}
                onEdit={(id) => router.push(`/admin/faculty/${id}/edit`)}
                onDelete={() => {}} // Add delete functionality if needed
              />
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Department Analysis</CardTitle>
              <CardDescription>Faculty distribution by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500 text-sm">Department chart will appear here</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Teaching Workload</CardTitle>
              <CardDescription>Average faculty teaching hours</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500 text-sm">Workload chart will appear here</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest faculty activities and assignments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center bg-gray-50 rounded-md">
                <p className="text-gray-500 text-sm">Activity timeline will appear here</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
