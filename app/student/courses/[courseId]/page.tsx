"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import React from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import {
  Book,
  Calendar,
  Clock,
  GraduationCap,
  BookOpen,
  User,
  CheckCircle,
  XCircle,
  FileText,
  Clock3,
  Building,
} from "lucide-react";

export default function CourseDetailPage({ params }: { params: { courseId: string } }) {
  const courseId = React.use(params).courseId;

  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>("overview");

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!user?.student?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/student/courses/${courseId}?studentId=${user.student.id}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCourse(data);
      } catch (error) {
        console.error("Failed to fetch course details:", error);
        toast({
          title: "Error",
          description: "Failed to load course details. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, user?.student?.id]);

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-screen -mt-16">
          <LoadingSpinner message="Loading course details..." />
        </div>
      </StudentLayout>
    );
  }

  if (!course) {
    return (
      <StudentLayout>
        <div className="py-8 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <h3 className="text-lg font-medium">Course not found</h3>
            <p>The course you're looking for could not be found or you don't have access to it.</p>
            <button 
              onClick={() => router.push('/student/courses')}
              className="mt-3 text-sm font-medium text-red-700 hover:text-red-500"
            >
              Return to courses
            </button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const courseName = course?.name || 'Unknown Course';
  const courseCode = course?.branch || '';
  const courseSemester = course?.semester || '';
  const courseYear = course?.year || '';
  const courseCredits = course?.credits || 0;
  const courseDescription = course?.description || 'No description available';
  const facultyName = course?.faculty?.name || 'Not assigned';
  const subjects = course?.subjects || [];
  const schedules = course?.schedule || [];
  const attendance = course?.attendance || { percentage: 0, total: 0, present: 0, absent: 0, late: 0 };
  const assignments = course?.assignments || [];

  return (
    <StudentLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{courseName}</h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                {courseCode && (
                  <span className="text-sm text-gray-500 flex items-center">
                    <BookOpen className="h-4 w-4 mr-1" />
                    {courseCode}
                  </span>
                )}
                {courseSemester && courseYear && (
                  <span className="text-sm text-gray-500 flex items-center ml-3">
                    <Calendar className="h-4 w-4 mr-1" />
                    {courseYear} - {courseSemester} Semester
                  </span>
                )}
              </div>
            </div>
            <Badge variant={course?.enrollment?.status === "ACTIVE" ? "success" : "secondary"}>
              {course?.enrollment?.status || 'Unknown Status'}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="mb-2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Course Overview */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Course Overview</CardTitle>
                  <CardDescription>Details and information about this course</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Description</h3>
                    <p className="mt-1 text-gray-800">{courseDescription}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Credits</h3>
                      <p className="mt-1 text-gray-800 flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2 text-gray-400" />
                        {courseCredits} Credits
                      </p>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Faculty</h3>
                      <p className="mt-1 text-gray-800 flex items-center">
                        <User className="h-4 w-4 mr-2 text-gray-400" />
                        {facultyName}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance</CardTitle>
                  <CardDescription>Your attendance for this course</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Overall Attendance</span>
                    <span className="text-sm font-medium">{attendance?.percentage?.toFixed(1)}%</span>
                  </div>
                  <Progress value={attendance?.percentage || 0} className="h-2" />
                  
                  <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                    <div className="bg-green-50 p-2 rounded-md">
                      <CheckCircle className="h-5 w-5 text-green-500 mx-auto mb-1" />
                      <span className="block text-xs text-gray-500">Present</span>
                      <span className="font-medium">{attendance?.present || 0}</span>
                    </div>
                    <div className="bg-red-50 p-2 rounded-md">
                      <XCircle className="h-5 w-5 text-red-500 mx-auto mb-1" />
                      <span className="block text-xs text-gray-500">Absent</span>
                      <span className="font-medium">{attendance?.absent || 0}</span>
                    </div>
                    <div className="bg-yellow-50 p-2 rounded-md">
                      <Clock3 className="h-5 w-5 text-yellow-500 mx-auto mb-1" />
                      <span className="block text-xs text-gray-500">Late</span>
                      <span className="font-medium">{attendance?.late || 0}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Upcoming Assignments */}
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Assignments</CardTitle>
                <CardDescription>Pending assignments for this course</CardDescription>
              </CardHeader>
              <CardContent>
                {assignments && assignments.length > 0 ? (
                  <div className="space-y-4">
                    {assignments
                      .filter(assignment => !assignment.isSubmitted)
                      .slice(0, 3)
                      .map((assignment) => (
                        <div key={assignment.id} className="flex justify-between items-center p-3 border rounded-lg">
                          <div>
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-gray-500">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                          </div>
                          <Badge className={new Date(assignment.dueDate) < new Date() ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}>
                            {new Date(assignment.dueDate) < new Date() ? "Overdue" : "Upcoming"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No upcoming assignments for this course</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Course Schedule</CardTitle>
                <CardDescription>Weekly class schedule for this course</CardDescription>
              </CardHeader>
              <CardContent>
                {schedules && schedules.length > 0 ? (
                  <div className="space-y-4">
                    {schedules.map((schedule) => (
                      <div key={schedule.id} className="p-4 border rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div className="flex items-center">
                            <div className="bg-blue-100 p-2 rounded-full text-blue-600 mr-4">
                              <Calendar className="h-5 w-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{schedule.day}</h3>
                              <p className="text-sm text-gray-500">
                                {schedule.startTime} - {schedule.endTime}
                              </p>
                            </div>
                          </div>
                          <div className="mt-3 md:mt-0 flex items-center">
                            <Building className="h-4 w-4 text-gray-400 mr-2" />
                            <span>{schedule.room || "Room TBD"}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Clock className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No schedule information available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <Card>
              <CardHeader>
                <CardTitle>Course Subjects</CardTitle>
                <CardDescription>Subjects covered in this course</CardDescription>
              </CardHeader>
              <CardContent>
                {subjects && subjects.length > 0 ? (
                  <div className="space-y-4">
                    {subjects.map((subject) => (
                      <div key={subject.id} className="p-4 border rounded-lg">
                        <div className="flex flex-col md:flex-row md:items-center justify-between">
                          <div>
                            <h3 className="font-medium">{subject.name}</h3>
                            <p className="text-sm text-gray-500">{subject.code}</p>
                          </div>
                          <div className="mt-3 md:mt-0">
                            <Badge>
                              {subject.creditHours} Credits
                            </Badge>
                            <div className="mt-2 text-sm text-gray-500">
                              <span className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {subject.faculty?.name || "Faculty not assigned"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Book className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No subjects associated with this course</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assignments Tab */}
          <TabsContent value="assignments">
            <Card>
              <CardHeader>
                <CardTitle>Assignments & Submissions</CardTitle>
                <CardDescription>Track all your assignments for this course</CardDescription>
              </CardHeader>
              <CardContent>
                {assignments && assignments.length > 0 ? (
                  <div className="space-y-6">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Assignment
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Due Date
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Grade
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {assignments.map((assignment) => (
                            <tr key={assignment.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-500">{new Date(assignment.dueDate).toLocaleDateString()}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge className={
                                  assignment.isSubmitted 
                                    ? "bg-green-100 text-green-800" 
                                    : new Date(assignment.dueDate) < new Date() 
                                      ? "bg-red-100 text-red-800" 
                                      : "bg-yellow-100 text-yellow-800"
                                }>
                                  {assignment.isSubmitted 
                                    ? "Submitted" 
                                    : new Date(assignment.dueDate) < new Date() 
                                      ? "Overdue" 
                                      : "Pending"}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900">
                                  {assignment.grade !== null && assignment.grade !== undefined 
                                    ? `${assignment.grade}/100` 
                                    : "-"}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No assignments have been added for this course</p>
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