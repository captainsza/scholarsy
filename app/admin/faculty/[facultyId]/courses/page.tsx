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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  ArrowLeft,
  BookOpen,
  Users,
  Calendar,
  MoreHorizontal,
  Eye,
  Edit,
  UserPlus,
  ClipboardList,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";

interface FacultyCoursesPageProps {
  params: {
    facultyId: string;
  };
}

export default function AdminFacultyCoursesPage({ params }: FacultyCoursesPageProps) {
  const { facultyId } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacultyCourses = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/faculty/${facultyId}/courses`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Faculty not found");
          }
          throw new Error("Failed to fetch faculty courses");
        }
        
        const data = await response.json();
        setFacultyData(data);
      } catch (err: any) {
        console.error("Error fetching faculty courses:", err);
        setError(err.message || "Failed to load faculty courses");
        toast({
          title: "Error",
          description: "Failed to load faculty courses",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyCourses();
  }, [facultyId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner message="Loading faculty courses..." />
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
            <h1 className="text-2xl font-bold text-gray-900">Faculty Courses</h1>
          </div>
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
                <div className="text-2xl font-bold text-blue-600">{facultyData.totalCourses}</div>
                <div className="text-sm text-gray-500">Total Courses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{facultyData.totalSubjects}</div>
                <div className="text-sm text-gray-500">Subjects Teaching</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {facultyData.courses?.reduce((sum: number, course: any) => sum + (course._count?.enrollments || 0), 0)}
                </div>
                <div className="text-sm text-gray-500">Total Students</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="assigned" className="space-y-4">
          <TabsList>
            <TabsTrigger value="assigned">
              <BookOpen className="h-4 w-4 mr-2" />
              Assigned Courses
            </TabsTrigger>
            <TabsTrigger value="subjects">
              <ClipboardList className="h-4 w-4 mr-2" />
              Subject Assignments
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle>Directly Assigned Courses</CardTitle>
                <CardDescription>
                  Courses where this faculty is the primary instructor
                </CardDescription>
              </CardHeader>
              <CardContent>
                {facultyData.courses && facultyData.courses.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Course Name</TableHead>
                        <TableHead>Branch & Year</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Subjects</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facultyData.courses.map((course: any) => (
                        <TableRow key={course.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{course.name}</div>
                              {course.code && (
                                <div className="text-sm text-gray-500">{course.code}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div>{course.branch}</div>
                              <div className="text-gray-500">Year {course.year}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{course.semester}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1 text-gray-400" />
                              {course._count?.enrollments || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 mr-1 text-gray-400" />
                              {course._count?.subjects || 0}
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
                                  onClick={() => router.push(`/admin/courses/${course.id}`)}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Course
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Edit Course
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/admin/courses/${course.id}/enroll`)}
                                >
                                  <UserPlus className="mr-2 h-4 w-4" />
                                  Manage Enrollments
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => router.push(`/admin/courses/${course.id}/subjects`)}
                                >
                                  <BookOpen className="mr-2 h-4 w-4" />
                                  Manage Subjects
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
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No courses assigned</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This faculty is not directly assigned to any courses.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Subject Assignments</CardTitle>
                <CardDescription>
                  Individual subjects taught by this faculty across different courses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {facultyData.coursesWithSubjects && facultyData.coursesWithSubjects.length > 0 ? (
                  <div className="space-y-6">
                    {facultyData.coursesWithSubjects.map((course: any) => (
                      <div key={course.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-medium">{course.name}</h3>
                            <p className="text-sm text-gray-500">
                              {course.branch} - Year {course.year}, {course.semester}
                            </p>
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <div>{course.subjects?.length || 0} subjects</div>
                            <div>{course.totalAssessments || 0} assessments</div>
                          </div>
                        </div>
                        
                        <div className="grid gap-3">
                          {course.subjects?.map((subject: any) => (
                            <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <div className="flex-1">
                                <div className="font-medium">{subject.name}</div>
                                <div className="text-sm text-gray-500">{subject.code}</div>
                              </div>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>{subject.creditHours} credits</span>
                                <span>{subject._count?.assessments || 0} assessments</span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => router.push(`/admin/subjects/${subject.id}`)}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      View Subject
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
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <ClipboardList className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No subject assignments</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This faculty is not assigned to teach any specific subjects.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
