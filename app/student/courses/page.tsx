"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import CourseCard from "@/components/student/CourseCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, Filter, BookOpen } from "lucide-react";

export default function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [semesterFilter, setSemesterFilter] = useState("all");
  
  // Add state for available academic terms
  const [academicTerms, setAcademicTerms] = useState<string[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.student?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/student/courses?studentId=${user.student.id}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCourses(data.courses || []);
        
        // Extract unique academic terms with null check
        const terms = new Set<string>();
        data.courses?.forEach((course: any) => {
          if (course && course.academicTerm) {
            terms.add(course.academicTerm);
          }
        });
        
        setAcademicTerms(Array.from(terms));
      } catch (error) {
        console.error("Failed to fetch student courses:", error);
        setError("Failed to load your courses. Please try refreshing the page.");
        toast({
          title: "Error",
          description: "Failed to load your courses. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user]);

  // Filter courses based on search query, active tab, and semester filter
  const filteredCourses = courses.filter(course => {
    // Filter by search query
    const matchesSearch = 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.code && course.code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (course.teacher && course.teacher.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Filter by course status
    const matchesStatus = activeTab === "all" || 
      (activeTab === "active" && course.enrollmentStatus === "ACTIVE") ||
      (activeTab === "completed" && course.enrollmentStatus === "COMPLETED");
    
    // Filter by semester/term
    const matchesSemester = semesterFilter === "all" || 
      (course.academicTerm && course.academicTerm === semesterFilter);
    
    return matchesSearch && matchesStatus && matchesSemester;
  });

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-screen -mt-16">
          <LoadingSpinner message="Loading your courses..." />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Courses</h1>
        
        {/* Filters and search */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search courses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="w-full md:w-64">
            <Select value={semesterFilter} onValueChange={setSemesterFilter}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="mr-2 h-4 w-4 text-gray-500" />
                  <SelectValue placeholder="Filter by semester" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Semesters</SelectItem>
                {academicTerms.map(term => (
                  <SelectItem key={term} value={term}>{term}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Tabs for different course statuses */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
            <Button 
              variant="link" 
              onClick={() => window.location.reload()}
              className="ml-2 underline"
            >
              Refresh
            </Button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-gray-500">
              {courses.length > 0 
                ? "No courses match your filter criteria."
                : "You aren't enrolled in any courses yet."}
            </p>
            {courses.length > 0 && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("");
                  setActiveTab("all");
                  setSemesterFilter("all");
                }}
                className="mt-4"
              >
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
