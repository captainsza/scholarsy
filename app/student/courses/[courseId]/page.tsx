"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StudentLayout from "@/components/layouts/StudentLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Calendar, BookOpen, ClipboardCheck, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface CourseDetailPageProps {
  params: {
    courseId: string;
  };
}

export default function CourseDetailPage({ params }: CourseDetailPageProps) {
  // Fix: Access courseId from params only after component is mounted
  const [courseId, setCourseId] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Set courseId after component mounts to avoid the sync API error
  useEffect(() => {
    if (params.courseId) {
      setCourseId(params.courseId);
    }
  }, [params.courseId]);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        if (!courseId || !user?.student?.id) return;
        
        setLoading(true);
        // Add the studentId as a query parameter
        const response = await fetch(`/api/student/courses/${courseId}?studentId=${user.student.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch course details");
        }
        
        const data = await response.json();
        setCourse(data.course);
      } catch (err) {
        console.error("Error fetching course details:", err);
        setError("Failed to load course details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId && user) {
      fetchCourseDetails();
    }
  }, [courseId, user]);

  if (loading) {
    return (
      <StudentLayout>
        <LoadingSpinner message="Loading course details..." />
      </StudentLayout>
    );
  }

  if (error || !course) {
    return (
      <StudentLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error || "Course not found"}</p>
            <Button 
              onClick={() => router.back()} 
              className="mt-4" 
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => router.push("/student/courses")}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <Badge variant="outline" className="ml-2">
                {course.code}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {course.section.name} • {course.section.academicTerm}
            </p>
          </div>

          <Badge 
            className="mt-2 md:mt-0" 
            variant={course.enrollment.status === "ACTIVE" ? "success" : "destructive"}
          >
            {course.enrollment.status}
          </Badge>
        </div>

        {/* Course details with tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
           
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Course Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Course Code</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Course Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Year</dt>
                      <dd className="mt-1 text-sm text-gray-900">3d</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Department</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.department}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Faculty</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.faculty?.name || "Not assigned"}</dd>
                    </div>

                    <div >
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.description || "No description available"}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              
            </div>

            {course.subjects && course.subjects.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Credits</TableHead>
                          <TableHead>Faculty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {course.subjects.map((subject: any) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.code}</TableCell>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell>{subject.creditHours}</TableCell>
                            <TableCell>
                              {subject.faculty ? (
                                `${subject.faculty.user.profile.firstName} ${subject.faculty.user.profile.lastName}`
                              ) : (
                                <Badge variant="outline">Not Assigned</Badge>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="materials">
            <Card>
              <CardHeader>
                <CardTitle>Course Materials</CardTitle>
                <CardDescription>View and download course resources</CardDescription>
              </CardHeader>
              <CardContent>
                {course.materials?.length > 0 ? (
                  <div className="space-y-4">
                    {course.materials.map((material: any) => (
                      <div key={material.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 text-blue-500 mr-3" />
                          <div>
                            <p className="font-medium">{material.title}</p>
                            <p className="text-xs text-gray-500">
                              Added {new Date(material.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No materials yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Course materials will appear here when they're available.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Assignments</CardTitle>
                <CardDescription>View and submit your assignments</CardDescription>
              </CardHeader>
              <CardContent>
                {course.assignments?.length > 0 ? (
                  <div className="space-y-4">
                    {course.assignments.map((assignment: any) => (
                      <div key={assignment.id} className="p-4 border rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-lg">{assignment.title}</h3>
                            <p className="text-sm text-gray-700 mt-1">{assignment.description}</p>
                          </div>
                          <Badge variant={new Date(assignment.dueDate) < new Date() ? "destructive" : "default"}>
                            Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </Badge>
                        </div>
                        
                        <div className="mt-4 flex justify-between items-center">
                          <div className="text-sm text-gray-500">
                            {assignment.submission ? (
                              <span className="text-green-600">Submitted on {new Date(assignment.submission.submittedAt).toLocaleDateString()}</span>
                            ) : (
                              <span>Not submitted</span>
                            )}
                          </div>
                          <Button size="sm">
                            {assignment.submission ? "View Submission" : "Submit Assignment"}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Assignments will appear here when they're assigned.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance</CardTitle>
                <CardDescription>View your attendance records</CardDescription>
              </CardHeader>
              <CardContent>
                {course.attendance?.length > 0 ? (
                  <div>
                    {/* Summary statistics */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-green-50 p-4 rounded-md">
                        <p className="text-sm text-green-700">Present</p>
                        <p className="text-2xl font-bold text-green-700">
                          {course.attendance.filter((a: any) => a.status === 'PRESENT').length}
                        </p>
                      </div>
                      <div className="bg-red-50 p-4 rounded-md">
                        <p className="text-sm text-red-700">Absent</p>
                        <p className="text-2xl font-bold text-red-700">
                          {course.attendance.filter((a: any) => a.status === 'ABSENT').length}
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-md">
                        <p className="text-sm text-yellow-700">Late</p>
                        <p className="text-2xl font-bold text-yellow-700">
                          {course.attendance.filter((a: any) => a.status === 'LATE').length}
                        </p>
                      </div>
                    </div>

                    {/* Attendance records list */}
                    <div className="overflow-x-auto mt-4">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Faculty Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {course.attendance.map((record: any) => (
                            <TableRow key={record.id}>
                              <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    record.status === 'PRESENT' ? 'success' : 
                                    record.status === 'ABSENT' ? 'destructive' : 'warning'
                                  }
                                >
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>{record.subject?.name || 'General'}</TableCell>
                              <TableCell>{record.remarks || 'No remarks'}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <ClipboardCheck className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Your attendance records will appear here once classes begin.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}