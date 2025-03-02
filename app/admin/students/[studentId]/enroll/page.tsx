"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ChevronLeft, Search } from "lucide-react";
import { toast } from "@/components/ui/toastall";

interface EnrollStudentPageProps {
  params: {
    studentId: string;
  };
}

export default function EnrollStudentPage({ params }: EnrollStudentPageProps) {
  const { studentId } = params;
  const router = useRouter();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [student, setStudent] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [sections, setSections] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Fetch student details and available courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch student details
        const studentResponse = await fetch(`/api/admin/students/${studentId}`);
        if (!studentResponse.ok) throw new Error("Failed to fetch student details");
        const studentData = await studentResponse.json();
        
        // Fetch available courses
        const coursesResponse = await fetch("/api/admin/courses?limit=100");
        if (!coursesResponse.ok) throw new Error("Failed to fetch courses");
        const coursesData = await coursesResponse.json();
        
        setStudent(studentData.student);
        setCourses(coursesData.courses || []);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId, toast]);

  // Fetch sections when course is selected
  useEffect(() => {
    const fetchSections = async () => {
      if (!selectedCourseId) {
        setSections([]);
        setSelectedSectionId("");
        return;
      }
      
      try {
        const response = await fetch(`/api/admin/courses/${selectedCourseId}/sections`);
        if (!response.ok) throw new Error("Failed to fetch sections");
        const data = await response.json();
        
        // Filter out sections that the student is already enrolled in
        const filteredSections = data.sections.filter((section: any) => {
          const isAlreadyEnrolled = section.enrollments?.some(
            (enrollment: any) => enrollment.studentId === studentId
          );
          return !isAlreadyEnrolled;
        });
        
        setSections(filteredSections);
        setSelectedSectionId("");
      } catch (error) {
        console.error("Error fetching sections:", error);
        toast({
          title: "Error",
          description: "Failed to load course sections",
          variant: "destructive"
        });
      }
    };
    
    fetchSections();
  }, [selectedCourseId, studentId, toast]);

  const handleSubmit = async () => {
    if (!selectedSectionId) {
      toast({
        title: "Error",
        description: "Please select a course section",
        variant: "destructive"
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const response = await fetch(`/api/admin/students/${studentId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sectionId: selectedSectionId,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to enroll student");
      }
      
      toast({
        title: "Success",
        description: "Student enrolled successfully",
        variant: "success",
      });
      
      // Navigate back to student enrollments page
      router.push(`/admin/students/${studentId}/enrollments`);
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to enroll student",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filter courses by search query
  const filteredCourses = searchQuery
    ? courses.filter(course => 
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        course.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : courses;

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading enrollment data..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <button 
            onClick={() => router.back()}
            className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Enroll Student in Course</h1>
          {student && (
            <p className="mt-1 text-gray-500">
              {student.user?.profile?.firstName} {student.user?.profile?.lastName} ({student.enrollmentId})
            </p>
          )}
        </div>

        <div className="max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Course Enrollment</CardTitle>
              <CardDescription>Select a course and section to enroll this student</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Course Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search Courses</label>
                  <div className="flex items-center mb-4 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search by course name or code"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <div className="border rounded-md max-h-[300px] overflow-y-auto">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <div className="grid grid-cols-12 text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="col-span-3">Code</div>
                        <div className="col-span-5">Course Name</div>
                        <div className="col-span-3">Department</div>
                        <div className="col-span-1">Credits</div>
                      </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                      {filteredCourses.length > 0 ? (
                        filteredCourses.map(course => (
                          <label 
                            key={course.id} 
                            className={`grid grid-cols-12 px-4 py-3 items-center cursor-pointer hover:bg-gray-50 ${
                              selectedCourseId === course.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="col-span-3 font-medium">{course.code}</div>
                            <div className="col-span-5">{course.name}</div>
                            <div className="col-span-3 text-gray-500">{course.department}</div>
                            <div className="col-span-1 text-center">{course.credits}</div>
                            <div className="absolute right-4">
                              <Checkbox
                                checked={selectedCourseId === course.id}
                                onCheckedChange={() => {
                                  setSelectedCourseId(
                                    selectedCourseId === course.id ? "" : course.id
                                  );
                                }}
                              />
                            </div>
                          </label>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-center text-gray-500">
                          No courses found
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section Selection */}
                {selectedCourseId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Section
                    </label>
                    {sections.length > 0 ? (
                      <Select
                        value={selectedSectionId}
                        onValueChange={setSelectedSectionId}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select a section" />
                        </SelectTrigger>
                        <SelectContent>
                          {sections.map(section => (
                            <SelectItem key={section.id} value={section.id}>
                              {section.name} - {section.academicTerm} 
                              ({section._count?.enrollments || 0}/{section.capacity} students)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="text-amber-600 text-sm p-2 bg-amber-50 rounded-md border border-amber-200">
                        No available sections found for this course, or the student is already enrolled in all sections.
                      </div>
                    )}
                  </div>
                )}

                {/* Submit Button */}
                <div className="pt-4 flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={!selectedSectionId || submitting}
                  >
                    {submitting ? "Enrolling..." : "Enroll Student"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
