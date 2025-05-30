"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  BookOpen,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  ClipboardList,
  UserCheck,
  Plus,
  BarChart3,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";

interface FacultySubjectsPageProps {
  params: {
    facultyId: string;
  };
}

export default function AdminFacultySubjectsPage({ params }: FacultySubjectsPageProps) {
  const { facultyId } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacultySubjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/faculty/${facultyId}/subjects`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Faculty not found");
          }
          throw new Error("Failed to fetch faculty subjects");
        }
        
        const data = await response.json();
        setFacultyData(data);
      } catch (err: any) {
        console.error("Error fetching faculty subjects:", err);
        setError(err.message || "Failed to load faculty subjects");
        toast({
          title: "Error",
          description: "Failed to load faculty subjects",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFacultySubjects();
  }, [facultyId]);

  const handleRemoveSubject = async (subjectId: string) => {
    if (!confirm("Are you sure you want to remove this faculty from the subject?")) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/faculty/${facultyId}/subjects?subjectId=${subjectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove faculty from subject");
      }

      // Remove subject from local state
      setFacultyData((prev: any) => ({
        ...prev,
        subjects: prev.subjects.filter((s: any) => s.id !== subjectId),
        totalSubjects: prev.totalSubjects - 1,
      }));

      toast({
        title: "Success",
        description: "Faculty removed from subject successfully",
      });
    } catch (error: any) {
      console.error("Error removing faculty from subject:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to remove faculty from subject",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner message="Loading faculty subjects..." />
        </div>
      </AdminLayout>
    );
  }

  if (error || !facultyData) {
    return (
      <AdminLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error || "Faculty not found"}</p>
            <Button 
              onClick={() => router.push("/admin/faculty")}
              className="mt-4"
              variant="outline"
            >
              Back to Faculty Management
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
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/faculty/${facultyId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Profile
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Subjects</h1>
          </div>
          <Button
            onClick={() => router.push(`/admin/faculty/${facultyId}/assign-subjects`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Subject
          </Button>
        </div>

        {/* Faculty Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {facultyData.faculty?.user?.profile?.firstName} {facultyData.faculty?.user?.profile?.lastName}
            </CardTitle>
            <CardDescription>
              {facultyData.faculty?.department} Department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{facultyData.totalSubjects}</div>
                <div className="text-sm text-gray-500">Total Subjects</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{facultyData.totalAssessments}</div>
                <div className="text-sm text-gray-500">Total Assessments</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{facultyData.totalStudents}</div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Table */}
        <Card>
          <CardHeader>
            <CardTitle>Assigned Subjects</CardTitle>
            <CardDescription>
              Subjects currently assigned to this faculty member
            </CardDescription>
          </CardHeader>
          <CardContent>
            {facultyData.subjects && facultyData.subjects.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Students</TableHead>
                    <TableHead>Assessments</TableHead>
                    <TableHead>Attendance</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facultyData.subjects.map((subject: any) => (
                    <TableRow key={subject.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{subject.name}</div>
                          <div className="text-sm text-gray-500">{subject.code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{subject.course.name}</div>
                          <div className="text-gray-500">
                            {subject.course.branch} - {subject.course.year} Year, {subject.course.semester}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{subject.creditHours}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          {subject.studentsCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <ClipboardList className="h-4 w-4 mr-1 text-gray-400" />
                          {subject.assessmentsCount}
                          {subject.upcomingAssessments?.length > 0 && (
                            <Badge variant="secondary" className="ml-2">
                              {subject.upcomingAssessments.length} upcoming
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <UserCheck className="h-4 w-4 mr-1 text-gray-400" />
                          {subject.attendancePercentage}%
                        </div>
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
                              onClick={() => router.push(`/admin/subjects/${subject.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Subject Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/subjects/${subject.id}/assessments`)}
                            >
                              <ClipboardList className="mr-2 h-4 w-4" />
                              View Assessments
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/subjects/${subject.id}/attendance`)}
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              View Attendance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => router.push(`/admin/subjects/${subject.id}/grades`)}
                            >
                              <BarChart3 className="mr-2 h-4 w-4" />
                              View Grades
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleRemoveSubject(subject.id)}
                              className="text-red-600"
                            >
                              <UserCheck className="mr-2 h-4 w-4" />
                              Remove Assignment
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects assigned</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This faculty member is not assigned to teach any subjects yet.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push(`/admin/faculty/${facultyId}/assign-subjects`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Assign Subjects
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
