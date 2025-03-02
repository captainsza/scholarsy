"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Search } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CourseWithSections {
  id: string;
  code: string;
  name: string;
  credits: number;
  department: string;
  sections: {
    id: string;
    name: string;
    academicTerm: string;
    _count: {
      enrollments: number;
      subjects: number;
    };
  }[];
}

export default function FacultyCourses() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<CourseWithSections[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        // Pass faculty ID as query param
        const facultyId = user?.faculty?.id;
        if (!facultyId) {
          setError("Faculty information not found");
          return;
        }
        
        const response = await fetch(`/api/faculty/courses?facultyId=${facultyId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch courses");
        }
        
        const data = await response.json();
        setCourses(data.courses);
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

  // Filter courses based on search term
  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <FacultyLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <LoadingSpinner message="Loading your courses..." />
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
          <p className="mt-1 text-sm text-gray-500">
            View all your assigned courses and sections
          </p>
        </div>

        {/* Search box */}
        <div className="mb-6">
          <div className="relative max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search courses..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
              {searchTerm ? "No courses match your search." : "You don't have any assigned courses yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredCourses.map((course) => (
              <Card key={course.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center">
                        <CardTitle>{course.name}</CardTitle>
                        <Badge variant="outline" className="ml-2">
                          {course.code}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {course.department} • {course.credits} Credits
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {course.sections.length} {course.sections.length === 1 ? "Section" : "Sections"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Section</TableHead>
                          <TableHead>Term</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Subjects</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {course.sections.map((section) => (
                          <TableRow key={section.id}>
                            <TableCell className="font-medium">{section.name}</TableCell>
                            <TableCell>{section.academicTerm}</TableCell>
                            <TableCell>{section._count.enrollments}</TableCell>
                            <TableCell>{section._count.subjects}</TableCell>
                            <TableCell className="text-right">
                              <Link
                                href={`/faculty/courses/${course.id}/sections/${section.id}`}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                View Details
                              </Link>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
