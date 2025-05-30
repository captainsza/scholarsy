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
import { 
  Plus, 
  Download, 
  Upload, 
  Filter, 
  ArrowUpDown, 
  ChevronDown, 
  X 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";

export default function AdminFacultyPage() {
  const router = useRouter();
  const [faculty, setFaculty] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Filter states
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [courseFilter, setCourseFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [workloadFilter, setWorkloadFilter] = useState("all");
  const [sortOption, setSortOption] = useState("name_asc");
  
  // Available options
  const [departments, setDepartments] = useState<string[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [statuses] = useState(["ACTIVE", "ON_LEAVE", "PART_TIME", "FULL_TIME"]);
  const [workloadRanges] = useState(["low", "medium", "high"]);
  
  // Active filters count
  const [activeFilterCount, setActiveFilterCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFaculty();
    fetchCoursesAndSubjects();
  }, [departmentFilter, courseFilter, subjectFilter, statusFilter, workloadFilter, sortOption]);

  // Count active filters
  useEffect(() => {
    let count = 0;
    if (departmentFilter !== "all") count++;
    if (courseFilter !== "all") count++;
    if (subjectFilter !== "all") count++;
    if (statusFilter !== "all") count++;
    if (workloadFilter !== "all") count++;
    setActiveFilterCount(count);
  }, [departmentFilter, courseFilter, subjectFilter, statusFilter, workloadFilter]);

  const fetchFaculty = async () => {
    try {
      setLoading(true);
      
      // Build query string with all filters
      const params = new URLSearchParams();
      if (departmentFilter !== "all") params.append("department", departmentFilter);
      if (courseFilter !== "all") params.append("course", courseFilter);
      if (subjectFilter !== "all") params.append("subject", subjectFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);
      if (workloadFilter !== "all") params.append("workload", workloadFilter);
      if (sortOption) params.append("sort", sortOption);
      
      const queryString = params.toString();
      const url = `/api/admin/faculty${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch faculty');
      }

      const data = await response.json();
      setFaculty(data.faculty);

      // Extract unique departments
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

  const fetchCoursesAndSubjects = async () => {
    try {
      const response = await fetch('/api/admin/courses');
      
      if (!response.ok) {
        throw new Error('Failed to fetch courses and subjects');
      }
      
      const data = await response.json();
      setCourses(data.courses);
      
      // Extract all subjects from all courses
      const allSubjects = data.courses.flatMap((course: any) => 
        course.subjects ? course.subjects.map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          courseId: course.id,
          courseName: course.name
        })) : []
      );
      
      setSubjects(allSubjects);
    } catch (error) {
      console.error('Error fetching courses and subjects:', error);
    }
  };

  const handleAddFaculty = () => {
    router.push('/admin/faculty/create');
  };

  const clearFilters = () => {
    setDepartmentFilter("all");
    setCourseFilter("all");
    setSubjectFilter("all");
    setStatusFilter("all");
    setWorkloadFilter("all");
  };

  // Filter faculty based on search query
  const filteredFaculty = faculty.filter((member: any) => {
    // Search query
    const query = searchQuery.toLowerCase();
    return (
      member.user?.profile?.firstName?.toLowerCase().includes(query) ||
      member.user?.profile?.lastName?.toLowerCase().includes(query) ||
      member.department?.toLowerCase().includes(query) ||
      member.user?.email?.toLowerCase().includes(query)
    );
  });

  // Get sorted label
  const getSortLabel = () => {
    switch(sortOption) {
      case 'name_asc': return 'Name (A-Z)';
      case 'name_desc': return 'Name (Z-A)';
      case 'department_asc': return 'Department (A-Z)';
      case 'department_desc': return 'Department (Z-A)';
      case 'workload_asc': return 'Workload (Low-High)';
      case 'workload_desc': return 'Workload (High-Low)';
      case 'newest': return 'Newest First';
      case 'oldest': return 'Oldest First';
      default: return 'Sort By';
    }
  };

  // Add delete handler
  const handleDeleteFaculty = async (facultyId: string) => {
    if (!confirm("Are you sure you want to delete this faculty member? This action cannot be undone.")) {
      return;
    }

    try {
      setDeleteLoading(facultyId);
      
      const response = await fetch(`/api/admin/faculty/${facultyId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete faculty member");
      }
      
      // Remove the faculty member from the local state
      setFaculty(faculty.filter((member: any) => member.id !== facultyId));
      
      toast({
        title: "Success",
        description: "Faculty member deleted successfully",
      });
    } catch (error: any) {
      console.error("Error deleting faculty member:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete faculty member",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(null);
    }
  };

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
 
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Faculty Directory</CardTitle>
            <CardDescription>
              View and manage all faculty members in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search and filters row */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              {/* Search input */}
              <div className="relative flex-1">
                <Input
                  placeholder="Search by name, email, department..."
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
              
              {/* Sort dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="hidden sm:inline">{getSortLabel()}</span>
                    <span className="sm:hidden">Sort</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort Faculty By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setSortOption('name_asc')}>
                      Name (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('name_desc')}>
                      Name (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('department_asc')}>
                      Department (A-Z)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('department_desc')}>
                      Department (Z-A)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('workload_asc')}>
                      Workload (Low-High)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('workload_desc')}>
                      Workload (High-Low)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('newest')}>
                      Newest First
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortOption('oldest')}>
                      Oldest First
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Advanced filters popover */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <Badge variant="outline" className="h-5 w-5 p-0 flex items-center justify-center rounded-full ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80 p-4" align="end">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Filter Faculty</h4>
                      {activeFilterCount > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={clearFilters}
                          className="h-8 px-2 text-xs"
                        >
                          Clear all
                        </Button>
                      )}
                    </div>
                    
                    {/* Department filter */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Department</label>
                      <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Departments" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Departments</SelectItem>
                          {departments.map((dept) => (
                            <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Course filter */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Teaching Course</label>
                      <Select value={courseFilter} onValueChange={setCourseFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Courses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Courses</SelectItem>
                          {courses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Subject filter */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Teaching Subject</label>
                      <Select 
                        value={subjectFilter} 
                        onValueChange={setSubjectFilter}
                        disabled={courseFilter !== "all" && !subjects.some(s => s.courseId === courseFilter)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="All Subjects" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {subjects
                            .filter(subject => courseFilter === "all" || subject.courseId === courseFilter)
                            .map((subject) => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.code}: {subject.name}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Status filter */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Status</label>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          {statuses.map((status) => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Workload filter */}
                    <div className="space-y-1">
                      <label className="text-sm font-medium">Workload</label>
                      <Select value={workloadFilter} onValueChange={setWorkloadFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Workloads" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Workloads</SelectItem>
                          <SelectItem value="low">Low (1-3 courses)</SelectItem>
                          <SelectItem value="medium">Medium (4-6 courses)</SelectItem>
                          <SelectItem value="high">High (7+ courses)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            {/* Active filters display */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4 p-2 bg-gray-50 rounded-md">
                <span className="text-sm text-gray-500">Active filters:</span>
                {departmentFilter !== "all" && (
                  <Badge variant="outline" className="pl-2 pr-1 flex items-center gap-1">
                    Dept: {departmentFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-gray-200 rounded-full" 
                      onClick={() => setDepartmentFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {courseFilter !== "all" && (
                  <Badge variant="outline" className="pl-2 pr-1 flex items-center gap-1">
                    Course: {courses.find(c => c.id === courseFilter)?.name || courseFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-gray-200 rounded-full" 
                      onClick={() => setCourseFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {subjectFilter !== "all" && (
                  <Badge variant="outline" className="pl-2 pr-1 flex items-center gap-1">
                    Subject: {subjects.find(s => s.id === subjectFilter)?.code || subjectFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-gray-200 rounded-full" 
                      onClick={() => setSubjectFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="outline" className="pl-2 pr-1 flex items-center gap-1">
                    Status: {statusFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-gray-200 rounded-full" 
                      onClick={() => setStatusFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                {workloadFilter !== "all" && (
                  <Badge variant="outline" className="pl-2 pr-1 flex items-center gap-1">
                    Workload: {workloadFilter}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 ml-1 hover:bg-gray-200 rounded-full" 
                      onClick={() => setWorkloadFilter("all")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
            )}
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner message="Loading faculty members..." />
              </div>
            ) : (
              <FacultyList
                faculty={filteredFaculty}
                onView={(id) => router.push(`/admin/faculty/${id}`)}
                onEdit={(id) => router.push(`/admin/faculty/${id}/edit`)}
                onDelete={handleDeleteFaculty}
                deleteLoading={deleteLoading}
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
