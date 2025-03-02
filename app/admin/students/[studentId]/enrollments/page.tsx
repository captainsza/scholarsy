"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronLeft, MoreHorizontal, Plus } from "lucide-react";
import { toast } from "@/components/ui/toastall";

interface StudentEnrollmentsPageProps {
  params: {
    studentId: string;
  };
}

export default function StudentEnrollmentsPage({ params }: StudentEnrollmentsPageProps) {
  const { studentId } = params;
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<any>(null);
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    const fetchStudentEnrollments = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/students/${studentId}/enrollments`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Student not found");
          }
          throw new Error("Failed to fetch enrollments");
        }
        
        const data = await response.json();
        setStudent(data.student);
        setEnrollments(data.enrollments || []);
      } catch (err: any) {
        console.error("Error fetching enrollments:", err);
        setError(err.message || "An error occurred while fetching student enrollments");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentEnrollments();
  }, [studentId]);

  const handleStatusChange = async (enrollmentId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/enrollments/${enrollmentId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update enrollment status");
      }
      
      // Update the enrollment in the local state
      setEnrollments(enrollments.map(enrollment => 
        enrollment.id === enrollmentId 
          ? { ...enrollment, status: newStatus } 
          : enrollment
      ));
      
      toast({
        title: "Enrollment Updated",
        description: `Enrollment status changed to ${newStatus}`,
        variant: "success",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update enrollment status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading student enrollments..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={() => router.push("/admin/students")}
              className="mt-4"
              variant="outline"
            >
              Back to Students
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <button 
              onClick={() => router.back()}
              className="flex items-center text-sm text-blue-600 hover:text-blue-800 mb-2"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Student Enrollments</h1>
            <p className="text-gray-500 mt-1">
              {student ? `${student.user?.profile?.firstName} ${student.user?.profile?.lastName}` : ""} - {student?.enrollmentId}
            </p>
          </div>
          <Button
            onClick={() => router.push(`/admin/students/${studentId}/enroll`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Enroll in Course
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Current Enrollments</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {enrollments.filter(e => e.status === "ACTIVE").length}
              <span className="text-sm font-normal text-gray-500 ml-2">Active</span>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Completed Courses</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {enrollments.filter(e => e.status === "COMPLETED").length}
              <span className="text-sm font-normal text-gray-500 ml-2">Completed</span>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Dropped Courses</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-bold">
              {enrollments.filter(e => e.status === "DROPPED").length}
              <span className="text-sm font-normal text-gray-500 ml-2">Dropped</span>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Enrollment History</CardTitle>
            <CardDescription>Manage student's course enrollments and sections</CardDescription>
          </CardHeader>
          <CardContent>
            {enrollments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Academic Term</TableHead>
                    <TableHead>Enrolled On</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => (
                    <TableRow key={enrollment.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{enrollment.section.course.name}</div>
                          <div className="text-sm text-gray-500">{enrollment.section.course.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>{enrollment.section.name}</TableCell>
                      <TableCell>{enrollment.section.academicTerm}</TableCell>
                      <TableCell>{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            enrollment.status === "ACTIVE" ? "success" : 
                            enrollment.status === "DROPPED" ? "destructive" :
                            enrollment.status === "ON_HOLD" ? "warning" : "default"
                          }
                        >
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/courses/${enrollment.section.course.id}/sections/${enrollment.section.id}`)}
                            >
                              View Section
                            </DropdownMenuItem>
                            
                            {enrollment.status !== "ACTIVE" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(enrollment.id, "ACTIVE")}>
                                Set as Active
                              </DropdownMenuItem>
                            )}
                            
                            {enrollment.status !== "ON_HOLD" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(enrollment.id, "ON_HOLD")}>
                                Put On Hold
                              </DropdownMenuItem>
                            )}
                            
                            {enrollment.status !== "COMPLETED" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(enrollment.id, "COMPLETED")}>
                                Mark as Completed
                              </DropdownMenuItem>
                            )}
                            
                            {enrollment.status !== "DROPPED" && (
                              <DropdownMenuItem 
                                className="text-red-600" 
                                onClick={() => handleStatusChange(enrollment.id, "DROPPED")}
                              >
                                Drop Enrollment
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500">This student is not enrolled in any courses.</p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push(`/admin/students/${studentId}/enroll`)}
                >
                  Enroll in Course
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
