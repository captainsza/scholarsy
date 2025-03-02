"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription, 
  CardFooter
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  Users, 
  Book, 
  Check, 
  BarChart3,
  FileText,
  Edit,
  Plus
} from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SectionDetailsPageProps {
  params: {
    courseId: string;
    sectionId: string;
  }
}

export default function SectionDetailsPage({ params }: SectionDetailsPageProps) {
  const [courseId, setCourseId] = useState<string>("");
  const [sectionId, setSectionId] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Set params after component mounts
  useEffect(() => {
    if (params.courseId && params.sectionId) {
      setCourseId(params.courseId);
      setSectionId(params.sectionId);
    }
  }, [params]);

  useEffect(() => {
    const fetchSectionDetails = async () => {
      try {
        if (!courseId || !sectionId || !user?.faculty?.id) return;

        setLoading(true);
        const response = await fetch(
          `/api/faculty/courses/${courseId}/sections/${sectionId}?facultyId=${user.faculty.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch section details");
        }

        const data = await response.json();
        setSection(data.section);
      } catch (err) {
        console.error("Error fetching section details:", err);
        setError("Failed to load section details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (courseId && sectionId && user) {
      fetchSectionDetails();
    }
  }, [courseId, sectionId, user]);

  if (loading) {
    return (
      <FacultyLayout>
        <LoadingSpinner message="Loading section details..." />
      </FacultyLayout>
    );
  }

  if (error || !section) {
    return (
      <FacultyLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error || "Section not found"}</p>
            <Button 
              onClick={() => router.push("/faculty/courses")}
              className="mt-4"
              variant="outline"
            >
              Back to Courses
            </Button>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => router.push("/faculty/courses")}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{section.course.name} - {section.name}</h1>
              <Badge variant="outline" className="ml-2">
                {section.course.code}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {section.academicTerm} • {section.enrollments?.length || 0}/{section.capacity} students
            </p>
          </div>
        </div>

        {/* Section details with tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Section Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Section Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{section.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Academic Term</dt>
                      <dd className="mt-1 text-sm text-gray-900">{section.academicTerm}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Course</dt>
                      <dd className="mt-1 text-sm text-gray-900">{section.course.name} ({section.course.code})</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Department</dt>
                      <dd className="mt-1 text-sm text-gray-900">{section.course.department}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                      <dd className="mt-1 text-sm text-gray-900">{section.enrollments?.length || 0}/{section.capacity} students</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Credits</dt>
                      <dd className="mt-1 text-sm text-gray-900">{section.course.credits}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Section Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Subjects</p>
                      <p className="mt-1 text-2xl font-semibold">{section.subjects?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Students Enrolled</p>
                      <p className="mt-1 text-2xl font-semibold">{section.enrollments?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Weekly Classes</p>
                      <p className="mt-1 text-2xl font-semibold">{section.schedules?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent>
                {section.schedules && section.schedules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Day</TableHead>
                          <TableHead>Time</TableHead>
                          <TableHead>Room</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.schedules.map((schedule: any) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="font-medium">{schedule.dayOfWeek}</TableCell>
                            <TableCell>{schedule.startTime} - {schedule.endTime}</TableCell>
                            <TableCell>{schedule.room?.name || "TBA"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-gray-500">No schedule information available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="subjects">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Subjects</CardTitle>
                  <CardDescription>Manage subjects for this section</CardDescription>
                </div>
                <Button onClick={() => router.push(`/faculty/courses/${courseId}/sections/${sectionId}/subjects/create`)}>
                  <Plus size={16} className="mr-2" />
                  Add Subject
                </Button>
              </CardHeader>
              <CardContent>
                {section.subjects && section.subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Credit Hours</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.subjects.map((subject: any) => (
                          <TableRow key={subject.id}>
                            <TableCell className="font-medium">{subject.code}</TableCell>
                            <TableCell>{subject.name}</TableCell>
                            <TableCell>{subject.creditHours}</TableCell>
                            <TableCell>
                              {subject.faculty ? (
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-medium mr-2">
                                    {subject.faculty.user.profile.firstName[0]}
                                    {subject.faculty.user.profile.lastName[0]}
                                  </div>
                                  <span>
                                    {subject.faculty.user.profile.firstName} {subject.faculty.user.profile.lastName}
                                  </span>
                                </div>
                              ) : (
                                <Badge variant="outline">Not Assigned</Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/faculty/subjects/${subject.id}`)}
                                >
                                  Manage
                                </Button>
                                {subject.faculty?.id === user?.faculty?.id && (
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => router.push(`/faculty/subjects/${subject.id}/attendance`)}
                                  >
                                    <Check size={16} className="mr-1" />
                                    Attendance
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Book className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Get started by adding subjects to this section.
                    </p>
                    <div className="mt-6">
                      <Button onClick={() => router.push(`/faculty/courses/${courseId}/sections/${sectionId}/subjects/create`)}>
                        <Plus size={16} className="mr-2" />
                        Add Subject
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Students Enrolled</CardTitle>
                <CardDescription>View and manage student enrollment</CardDescription>
              </CardHeader>
              <CardContent>
                {section.enrollments && section.enrollments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Enrollment Status</TableHead>
                          <TableHead>Enrolled On</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.enrollments.map((enrollment: any) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">{enrollment.student.enrollmentId}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium mr-2">
                                  {enrollment.student.user.profile.firstName[0]}
                                  {enrollment.student.user.profile.lastName[0]}
                                </div>
                                <span>
                                  {enrollment.student.user.profile.firstName} {enrollment.student.user.profile.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  enrollment.status === "ACTIVE" ? "success" : 
                                  enrollment.status === "DROPPED" ? "destructive" : "default"
                                }
                              >
                                {enrollment.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/faculty/students/${enrollment.student.id}`)}
                              >
                                View Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This section doesn't have any enrolled students yet.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="attendance">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Management</CardTitle>
                <CardDescription>Record and track student attendance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-8">
                  <h3 className="text-lg font-medium mb-4">Record New Attendance</h3>
                  {section.subjects && section.subjects.length > 0 ? (
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {section.subjects.filter((subject: any) => 
                          subject.faculty?.id === user?.faculty?.id
                        ).map((subject: any) => (
                          <Card key={subject.id} className="overflow-hidden">
                            <CardHeader className="bg-gray-50">
                              <CardTitle>{subject.name}</CardTitle>
                              <CardDescription>{subject.code}</CardDescription>
                            </CardHeader>
                            <CardContent className="pt-4">
                              <p className="text-sm text-gray-500 mb-4">
                                Click below to take attendance for this subject.
                              </p>
                            </CardContent>
                            <CardFooter className="bg-gray-50 flex justify-between">
                              <Button 
                                variant="outline"
                                onClick={() => router.push(`/faculty/subjects/${subject.id}/attendance/history`)}
                              >
                                View History
                              </Button>
                              <Button 
                                onClick={() => router.push(`/faculty/subjects/${subject.id}/attendance/take`)}
                              >
                                <Check className="mr-2 h-4 w-4" />
                                Take Attendance
                              </Button>
                            </CardFooter>
                          </Card>
                        ))}
                      </div>

                      {section.subjects.filter((subject: any) => 
                        subject.faculty?.id === user?.faculty?.id
                      ).length === 0 && (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <p className="text-yellow-700">
                            You are not the instructor for any subjects in this section.
                            You can only record attendance for subjects you teach.
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No subjects available to record attendance</p>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Recent Attendance Records</h3>
                  
                  <div className="bg-blue-50 p-4 rounded-md mb-6">
                    <p className="text-blue-700 text-sm">
                      The attendance history view is coming soon. You will be able to view attendance statistics
                      and trends for this section here.
                    </p>
                  </div>

                  <div className="flex justify-end">
                    <Button variant="outline">View Full Attendance Report</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assignments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Assignments</CardTitle>
                  <CardDescription>Create and manage assignments</CardDescription>
                </div>
                <Button>
                  <Plus size={16} className="mr-2" />
                  Create Assignment
                </Button>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Your Subjects</h3>
                  
                  {section.subjects && section.subjects.filter((subject: any) => 
                    subject.faculty?.id === user?.faculty?.id
                  ).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {section.subjects.filter((subject: any) => 
                        subject.faculty?.id === user?.faculty?.id
                      ).map((subject: any) => (
                        <Card key={subject.id} className="overflow-hidden">
                          <CardHeader className="bg-gray-50 py-3">
                            <p className="font-medium">{subject.name}</p>
                            <p className="text-xs text-gray-500">{subject.code}</p>
                          </CardHeader>
                          <CardContent className="py-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm">{subject.creditHours} credit hours</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => router.push(`/faculty/subjects/${subject.id}/assignments`)}
                              >
                                Manage
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                      <p className="text-yellow-700">
                        You are not the instructor for any subjects in this section.
                        You can only manage assignments for subjects you teach.
                      </p>
                    </div>
                  )}
                </div>

                <div className="bg-blue-50 p-4 rounded-md mb-6">
                  <p className="text-blue-700 text-sm">
                    The assignments dashboard is coming soon. Here you will be able to create, 
                    evaluate, and manage all assignments across your subjects.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}
