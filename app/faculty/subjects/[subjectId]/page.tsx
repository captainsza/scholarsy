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
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { 
  BookOpen, 
  Users, 
  Clock, 
  CheckCircle2, 
  BarChart3,
  FileText,
  Calendar,
  Edit,
  Plus
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SubjectDetailsPageProps {
  params: {
    subjectId: string;
  }
}

export default function SubjectDetailsPage({ params }: SubjectDetailsPageProps) {
  const [subjectId, setSubjectId] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Set params after component mounts
  useEffect(() => {
    if (params.subjectId) {
      setSubjectId(params.subjectId);
    }
  }, [params]);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      try {
        if (!subjectId || !user?.faculty?.id) return;

        setLoading(true);
        const response = await fetch(
          `/api/faculty/subjects/${subjectId}?facultyId=${user.faculty.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subject details");
        }

        const data = await response.json();
        console.log("Subject data:", data);
        
        setSubject(data.subject);
        setAttendanceStats(data.attendanceStats);
        setAssessments(data.assessments || []);
      } catch (err) {
        console.error("Error fetching subject details:", err);
        setError("Failed to load subject details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (subjectId && user) {
      fetchSubjectDetails();
    }
  }, [subjectId, user]);

  if (loading) {
    return (
      <FacultyLayout>
        <LoadingSpinner message="Loading subject details..." />
      </FacultyLayout>
    );
  }

  if (error || !subject) {
    return (
      <FacultyLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error || "Subject not found"}</p>
            <Button 
              onClick={() => router.back()}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  const isSubjectInstructor = subject.faculty?.id === user?.faculty?.id;

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => router.back()}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
              <Badge variant="outline" className="ml-2">
                {subject.code}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {subject.section?.course?.name} • {subject.section?.name} • {subject.section?.academicTerm}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            {isSubjectInstructor && (
              <>
                <Button 
                  variant="outline"
                  onClick={() => router.push(`/faculty/subjects/${subjectId}/attendance`)}
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Attendance
                </Button>
                <Button 
                  onClick={() => router.push(`/faculty/subjects/${subjectId}/assignments`)}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Assignments
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Subject details with tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="attendance">Attendance</TabsTrigger>
            <TabsTrigger value="assignments">Assessments</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Subject Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subject Name</dt>
                      <dd className="mt-1 text-sm text-gray-900">{subject.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Subject Code</dt>
                      <dd className="mt-1 text-sm text-gray-900">{subject.code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Credit Hours</dt>
                      <dd className="mt-1 text-sm text-gray-900">{subject.creditHours}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Instructor</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {subject.faculty ? (
                          <div className="flex items-center">
                            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium mr-2">
                              {subject.faculty.user.profile.firstName[0]}
                              {subject.faculty.user.profile.lastName[0]}
                            </div>
                            <span>
                              {subject.faculty.user.profile.firstName} {subject.faculty.user.profile.lastName}
                            </span>
                            {isSubjectInstructor && (
                              <Badge variant="outline" className="ml-2">You</Badge>
                            )}
                          </div>
                        ) : (
                          "Not assigned"
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Course</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {subject.section?.course?.name} ({subject.section?.course?.code})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Section</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {subject.section?.name} ({subject.section?.academicTerm})
                      </dd>
                    </div>
                  </dl>
                  
                  <div className="mt-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Description</h4>
                    <p className="text-sm text-gray-900">
                      {subject.description || "No description available."}
                    </p>
                  </div>
                </CardContent>
                {isSubjectInstructor && (
                  <CardFooter className="bg-gray-50 flex justify-end">
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/faculty/subjects/${subjectId}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Subject
                    </Button>
                  </CardFooter>
                )}
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Enrolled Students</p>
                      <p className="mt-1 text-2xl font-semibold">{subject.section?.enrollments?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Attendance Sessions</p>
                      <p className="mt-1 text-2xl font-semibold">{attendanceStats?.totalClasses || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Assessments</p>
                      <p className="mt-1 text-2xl font-semibold">{assessments?.length || 0}</p>
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
                {subject.section?.schedules && subject.section.schedules.length > 0 ? (
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
                        {subject.section.schedules.map((schedule: any) => (
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
          
          <TabsContent value="students">
            <Card>
              <CardHeader>
                <CardTitle>Enrolled Students</CardTitle>
                <CardDescription>All students enrolled in this subject's section</CardDescription>
              </CardHeader>
              <CardContent>
                {subject.section?.enrollments && subject.section.enrollments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Student Name</TableHead>
                          <TableHead>Enrollment Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subject.section.enrollments.map((enrollment: any) => (
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
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/faculty/students/${enrollment.student.id}`)}
                              >
                                View Profile
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
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Attendance Records</CardTitle>
                  <CardDescription>Recent attendance activity</CardDescription>
                </div>
                {isSubjectInstructor && (
                  <Button onClick={() => router.push(`/faculty/subjects/${subjectId}/attendance/take`)}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Take Attendance
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {attendanceStats && attendanceStats.records && attendanceStats.records.length > 0 ? (
                  <>
                    <div className="mb-6">
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Attendance Summary</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="font-medium text-green-600">Present</div>
                          <div className="text-2xl font-bold">
                            {attendanceStats.records.filter((r: any) => r.status === 'PRESENT').length}
                          </div>
                          <div className="text-xs text-green-800 mt-1">
                            {((attendanceStats.records.filter((r: any) => r.status === 'PRESENT').length / 
                              attendanceStats.totalRecords) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="font-medium text-yellow-600">Late</div>
                          <div className="text-2xl font-bold">
                            {attendanceStats.records.filter((r: any) => r.status === 'LATE').length}
                          </div>
                          <div className="text-xs text-yellow-800 mt-1">
                            {((attendanceStats.records.filter((r: any) => r.status === 'LATE').length / 
                              attendanceStats.totalRecords) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                        <div className="bg-red-50 p-4 rounded-lg">
                          <div className="font-medium text-red-600">Absent</div>
                          <div className="text-2xl font-bold">
                            {attendanceStats.records.filter((r: any) => r.status === 'ABSENT').length}
                          </div>
                          <div className="text-xs text-red-800 mt-1">
                            {((attendanceStats.records.filter((r: any) => r.status === 'ABSENT').length / 
                              attendanceStats.totalRecords) * 100).toFixed(1)}% of total
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Recent Attendance Records</h3>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Remarks</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attendanceStats.records.slice(0, 10).map((record: any) => (
                            <TableRow key={record.id}>
                              <TableCell>
                                {new Date(record.date).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium mr-2">
                                    {record.student.user.profile.firstName[0]}
                                    {record.student.user.profile.lastName[0]}
                                  </div>
                                  <span>
                                    {record.student.user.profile.firstName} {record.student.user.profile.lastName}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge 
                                  variant={
                                    record.status === "PRESENT" ? "success" : 
                                    record.status === "ABSENT" ? "destructive" : "warning"
                                  }
                                >
                                  {record.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {record.remarks || 
                                  <span className="text-gray-400 italic">No remarks</span>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-10">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Attendance records for this subject will appear here once they're taken.
                    </p>
                    {isSubjectInstructor && (
                      <Button 
                        onClick={() => router.push(`/faculty/subjects/${subjectId}/attendance/take`)}
                        className="mt-4"
                      >
                        Take Attendance
                      </Button>
                    )}
                  </div>
                )}
                
                {attendanceStats && attendanceStats.records && attendanceStats.records.length > 0 && (
                  <div className="mt-6 text-right">
                    <Button 
                      variant="outline"
                      onClick={() => router.push(`/faculty/subjects/${subjectId}/attendance`)}
                    >
                      View All Attendance Records
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="assignments">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>All quizzes, assignments, and exams</CardDescription>
                </div>
                {isSubjectInstructor && (
                  <Button onClick={() => router.push(`/faculty/subjects/${subjectId}/assignments/create`)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Assessment
                  </Button>
                )}
              </CardHeader>
              <CardContent>
                {assessments && assessments.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead>Max Marks</TableHead>
                          <TableHead>Weightage</TableHead>
                          <TableHead>Submissions</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {assessments.map((assessment) => (
                          <TableRow key={assessment.id}>
                            <TableCell className="font-medium">{assessment.title}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {assessment.type}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {assessment.dueDate ? 
                                new Date(assessment.dueDate).toLocaleDateString() : 
                                <span className="text-gray-400">—</span>
                              }
                            </TableCell>
                            <TableCell>{assessment.maxMarks}</TableCell>
                            <TableCell>{assessment.weightage}%</TableCell>
                            <TableCell>
                              {assessment.marks ? 
                                `${assessment.marks.length} / ${subject.section?.enrollments?.length || 0}` : 
                                '0'
                              }
                            </TableCell>
                            <TableCell>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => router.push(`/faculty/subjects/${subjectId}/assignments/${assessment.id}`)}
                              >
                                {isSubjectInstructor ? 'Manage' : 'View'}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No assessments yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {isSubjectInstructor ? 
                        "Get started by creating your first assessment." : 
                        "No assessments have been created for this subject yet."}
                    </p>
                    {isSubjectInstructor && (
                      <Button 
                        onClick={() => router.push(`/faculty/subjects/${subjectId}/assignments/create`)}
                        className="mt-4"
                      >
                        Create Assessment
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}
