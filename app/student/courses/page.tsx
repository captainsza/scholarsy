"use client";

import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { useAuth } from "@/context/AuthContext";
import CourseCard from "@/components/student/CourseCard";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Search, Filter } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  faculty: {
    name: string;
  };
  section: {
    name: string;
    academicTerm: string;
  };
  enrollment: {
    status: string;
  };
  progress?: number;
}

export default function StudentCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [termFilter, setTermFilter] = useState<string>("");
  const [availableTerms, setAvailableTerms] = useState<string[]>([]);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Pass student ID as query param
        const studentId = user?.student?.id;
        if (!studentId) {
          setError("Student information not found");
          return;
        }
        
        const response = await fetch(`/api/student/courses?studentId=${studentId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        
        const data = await response.json();
        setCourses(data.courses);
        
        // Extract unique academic terms for filtering
        const terms = Array.from(
          new Set(
            data.courses.map((course: Course) => course.section.academicTerm)
          )
        ) as string[];
        setAvailableTerms(terms);
      } catch (err: any) {
        console.error("Error fetching courses:", err);
        setError(err.message || "Failed to load courses. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchCourses();
    }
  }, [user]);

  // Filter courses based on search term and academic term
  const filteredCourses = courses.filter(
    (course) => {
      const matchesSearch = 
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (course.faculty?.name && course.faculty.name.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesTerm = termFilter ? 
        course.section.academicTerm === termFilter : true;
      
      return matchesSearch && matchesTerm;
    }
  );

  if (loading) {
    return (
      <StudentLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <LoadingSpinner message="Loading your courses..." />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all courses you are enrolled in
          </p>
        </div>

        {/* Search and filters */}
        <div className="mb-6 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="w-full sm:w-48">
            <Select
              value={termFilter}
              onValueChange={setTermFilter}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Terms" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Terms</SelectItem> {/* Changed from empty string to "_all" */}
                {availableTerms.map((term) => (
                  <SelectItem key={term} value={term || "undefined"}>
                    {term || "Undefined Term"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {filteredCourses.length === 0 ? (
          <div className="bg-white p-8 rounded-md shadow-sm text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || termFilter ? 
                "No courses match your filters." : 
                "You are not enrolled in any courses yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
