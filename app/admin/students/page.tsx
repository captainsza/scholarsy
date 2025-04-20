"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import StudentList from "@/components/admin/students/StudentList";
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

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/admin/students');
        
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        
        const data = await response.json();
        setStudents(data.students);
        
        // Extract unique departments
        const uniqueDepartments = [...new Set(data.students.map((student: any) => student.department))] as string[];
        setDepartments(uniqueDepartments);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast({
          title: "Error",
          description: "Failed to load students. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleAddStudent = () => {
    router.push('/admin/students/create');
  };

  // Filter students based on search query and department filter
  const filteredStudents = students.filter((student: any) => {
    // Department filter
    if (departmentFilter !== "all" && student.department !== departmentFilter) {
      return false;
    }
    
    // Search query
    const query = searchQuery.toLowerCase();
    return (
      student.user?.profile?.firstName?.toLowerCase().includes(query) ||
      student.user?.profile?.lastName?.toLowerCase().includes(query) ||
      student.enrollmentId?.toLowerCase().includes(query) ||
      student.department?.toLowerCase().includes(query)
    );
  });

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage student records, enrollments, and academic information
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
              onClick={handleAddStudent}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Student
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Student Records</CardTitle>
            <CardDescription>
              View and manage all student accounts in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Input
                  placeholder="Search by name, enrollment ID..."
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
                <LoadingSpinner message="Loading students..." />
              </div>
            ) : (
              <StudentList 
                students={filteredStudents} 
                onView={(id) => router.push(`/admin/students/${id}`)}
                onEdit={(id) => router.push(`/admin/students/${id}/edit`)}
                onDelete={() => {}} // Add delete functionality if needed
              />
            )}
          </CardContent>
        </Card>


      </div>
    </AdminLayout>
  );
}
