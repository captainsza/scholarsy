"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toastall";
import { Search } from "lucide-react";

interface Student {
  id: string;
  enrollmentId: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  department: string;
  isEnrolled?: boolean;
}

interface CourseDetails {
  id: string;
  name: string;
  branch: string;
  year: string;
  semester: string;
}

export default function EnrollStudentsPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const courseId = params.courseId;

  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch course details and students
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch course details
        const courseResponse = await fetch(`/api/admin/courses/${courseId}`);
        if (!courseResponse.ok) {
          throw new Error("Failed to fetch course details");
        }
        const courseData = await courseResponse.json();
        setCourseDetails(courseData.course);

        // Fetch students with enrollment status
        const studentsResponse = await fetch(`/api/admin/courses/${courseId}/enroll`);
        if (!studentsResponse.ok) {
          throw new Error("Failed to fetch students");
        }
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students);
        setFilteredStudents(studentsData.students);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load course or student data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  // Filter students based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredStudents(students);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.enrollmentId.toLowerCase().includes(query) ||
        student.user.profile.firstName.toLowerCase().includes(query) ||
        student.user.profile.lastName.toLowerCase().includes(query) ||
        student.department.toLowerCase().includes(query)
    );

    setFilteredStudents(filtered);
  }, [searchQuery, students]);

  // Handle selection of all students
  const handleSelectAll = () => {
    if (selectedStudents.size === filteredStudents.length) {
      // If all are selected, deselect all
      setSelectedStudents(new Set());
    } else {
      // Otherwise, select all filtered students
      const newSelection = new Set<string>();
      filteredStudents.forEach((student) => {
        if (!student.isEnrolled) {
          newSelection.add(student.id);
        }
      });
      setSelectedStudents(newSelection);
    }
  };

  // Handle selection of individual student
  const handleSelectStudent = (studentId: string) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  // Handle enrollment
  const handleEnrollStudents = async () => {
    if (selectedStudents.size === 0) {
      toast({
        title: "No Students Selected",
        description: "Please select at least one student to enroll",
        variant: "destructive",
      });
      return;
    }

    setEnrolling(true);
    try {
      const response = await fetch(`/api/admin/courses/${courseId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentIds: Array.from(selectedStudents),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to enroll students");
      }

      toast({
        title: "Success",
        description: `${selectedStudents.size} student(s) enrolled successfully`,
      });

      // Refresh the student list with updated enrollment status
      const studentsResponse = await fetch(`/api/admin/courses/${courseId}/enroll`);
      if (studentsResponse.ok) {
        const studentsData = await studentsResponse.json();
        setStudents(studentsData.students);
        setFilteredStudents(studentsData.students);
      }

      // Clear selection
      setSelectedStudents(new Set());
    } catch (error: any) {
      console.error("Enrollment error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to enroll students",
        variant: "destructive",
      });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Enroll Students</h1>
            {courseDetails && (
              <p className="text-gray-600">
                {courseDetails.name} - {courseDetails.branch} ({courseDetails.year} Year, Semester {courseDetails.semester})
              </p>
            )}
          </div>
          <Button variant="outline" onClick={() => router.back()}>
            Back to Course
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Student Enrollment</h2>
            <p className="mt-1 text-sm text-gray-500">Select students to enroll in this course</p>
          </div>

          <div className="p-6 flex flex-col sm:flex-row justify-between gap-4 border-b border-gray-200">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={handleEnrollStudents}
              disabled={enrolling || selectedStudents.size === 0}
            >
              {enrolling ? "Enrolling..." : `Enroll Selected (${selectedStudents.size})`}
            </Button>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={filteredStudents.length > 0 && selectedStudents.size === filteredStudents.filter(s => !s.isEnrolled).length}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all students"
                    />
                  </TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Enrollment ID</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                      No students found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.has(student.id)}
                          onCheckedChange={() => handleSelectStudent(student.id)}
                          disabled={student.isEnrolled}
                          aria-label={`Select ${student.user.profile.firstName}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {student.user.profile.firstName} {student.user.profile.lastName}
                      </TableCell>
                      <TableCell>{student.enrollmentId}</TableCell>
                      <TableCell>{student.department}</TableCell>
                      <TableCell>
                        {student.isEnrolled ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Enrolled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            Not Enrolled
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
