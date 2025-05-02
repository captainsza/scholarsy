"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/ui/toastall";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  Info,
  Clock,
  GraduationCap,
  MapPin,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Badge } from "@/components/ui/Badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

// Types
interface Student {
  id: string;
  name: string;
  enrollmentId: string;
  profileImage: string | null;
  enrollmentStatus: string;
  enrolledAt: string;
}

interface Subject {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  description: string;
}

interface Schedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  room: string;
  subjectName: string;
  subjectCode: string;
}

interface CourseDetails {
  id: string;
  name: string;
  description: string;
  branch: string;
  year: string;
  semester: string;
  credits: number;
  coordinatorName: string;
  isCoordinator: boolean;
  subjects: Subject[];
  students: Student[];
  schedules: Schedule[];
  studentCount: number;
  subjectCount: number;
}

export default function FacultyCourseDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const courseId = params?.courseId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [currentTab, setCurrentTab] = useState("overview");
  
  // Pagination for students list
  const [currentPage, setCurrentPage] = useState(1);
  const studentsPerPage = 10;

  // Format time string (e.g., "14:30" to "2:30 PM")
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    } catch (error) {
      return time;
    }
  };

  // Fetch course details
  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!courseId) return;

      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/faculty/courses/${courseId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch course details: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCourseDetails(data.course);
      } catch (error: any) {
        console.error("Error fetching course details:", error);
        setError(error.message || "Failed to load course details");
        toast({
          title: "Error",
          description: "Failed to load course details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId]);

  // Get current students based on pagination
  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = courseDetails?.students.slice(indexOfFirstStudent, indexOfLastStudent) || [];
  const totalPages = courseDetails?.students ? Math.ceil(courseDetails.students.length / studentsPerPage) : 1;

  if (loading) {
    return (
      <FacultyLayout>
        <div className="p-8">
          <LoadingSpinner message="Loading course details..." />
        </div>
      </FacultyLayout>
    );
  }

  if (error) {
    return (
      <FacultyLayout>
        <div className="p-8">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="text-red-600">Error</CardTitle>
              <CardDescription>Failed to load course details</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{error}</p>
              <Button className="mt-4" onClick={() => router.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </FacultyLayout>
    );
  }

  if (!courseDetails) {
    return (
      <FacultyLayout>
        <div className="p-8">
          <Card>
            <CardHeader>
              <CardTitle>Course Not Found</CardTitle>
              <CardDescription>The requested course could not be found</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.back()}>Go Back</Button>
            </CardContent>
          </Card>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="p-6">
        {/* Header with back button */}
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center space-x-2 text-gray-600 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Courses</span>
          </Button>
        </div>
        
        {/* Course title section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{courseDetails.name}</h1>
            <div className="flex items-center mt-1 space-x-2">
              <Badge variant="outline">{courseDetails.branch}</Badge>
              <Badge variant="outline">Year {courseDetails.year}</Badge>
              <Badge variant="outline">Semester {courseDetails.semester}</Badge>
              {courseDetails.isCoordinator && (
                <Badge className="bg-indigo-100 text-indigo-800">Coordinator</Badge>
              )}
            </div>
          </div>
          
          <div className="mt-4 md:mt-0">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Users className="mr-2 h-4 w-4" />
              {courseDetails.studentCount} Students Enrolled
            </Button>
          </div>
        </div>
        
        {/* Tabs for content sections */}
        <Tabs value={currentTab} onValueChange={setCurrentTab} className="mb-6">
          <TabsList className="grid grid-cols-4 mb-8 lg:w-1/2">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="subjects">My Subjects</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 text-indigo-500 mr-2" />
                    Course Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-medium text-gray-500">Description</h3>
                      <p className="mt-1 text-gray-900">
                        {courseDetails.description || "No description available."}
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Branch</h3>
                        <p className="mt-1 text-gray-900">{courseDetails.branch}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Year</h3>
                        <p className="mt-1 text-gray-900">{courseDetails.year}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Semester</h3>
                        <p className="mt-1 text-gray-900">{courseDetails.semester}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Credits</h3>
                        <p className="mt-1 text-gray-900">{courseDetails.credits}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Course Coordinator</h3>
                        <p className="mt-1 text-gray-900">{courseDetails.coordinatorName}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500">Your Role</h3>
                        <p className="mt-1 text-gray-900">
                          {courseDetails.isCoordinator ? "Course Coordinator" : "Subject Faculty"}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Stats Card */}
              <div className="space-y-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Your Subjects</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <BookOpen className="h-8 w-8 text-indigo-500 mr-4" />
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{courseDetails.subjectCount}</p>
                        <p className="text-sm text-gray-500">Subjects you teach in this course</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Students</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Users className="h-8 w-8 text-indigo-500 mr-4" />
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{courseDetails.studentCount}</p>
                        <p className="text-sm text-gray-500">Actively enrolled students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-500">Weekly Classes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-indigo-500 mr-4" />
                      <div>
                        <p className="text-3xl font-bold text-gray-900">{courseDetails.schedules.length}</p>
                        <p className="text-sm text-gray-500">Scheduled sessions per week</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
          
          {/* Subjects Tab */}
          <TabsContent value="subjects">
            {courseDetails.subjects.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Subjects Assigned</h3>
                  <p className="text-gray-500">You are not currently teaching any subjects in this course.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courseDetails.subjects.map((subject) => (
                  <Card key={subject.id} className="overflow-hidden border-l-4 border-l-indigo-500">
                    <CardHeader className="bg-gray-50 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <Badge variant="outline" className="mb-2">{subject.code}</Badge>
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                        </div>
                        <Badge>{subject.creditHours} Credits</Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="pt-4">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {subject.description || "No description available"}
                      </p>
                      
                      <div className="flex justify-between">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/faculty/courses/${courseId}/subjects/${subject.id}`)}
                        >
                          View Details
                        </Button>
                        
                        <Button 
                          size="sm"
                          onClick={() => router.push(`/faculty/courses/${courseId}/subjects/${subject.id}/attendance/take`)}
                        >
                          Take Attendance
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          
          {/* Students Tab */}
          <TabsContent value="students">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 text-indigo-500 mr-2" />
                    Enrolled Students
                  </CardTitle>
                  <Badge variant="outline">{courseDetails.studentCount} Students</Badge>
                </div>
                <CardDescription>
                  Students currently enrolled in this course
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {courseDetails.students.length === 0 ? (
                  <div className="text-center py-8">
                    <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No students enrolled in this course yet.</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50 border-b">
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrollment ID</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Enrolled On</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {currentStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <Avatar className="h-8 w-8 mr-3">
                                    <AvatarImage src={student.profileImage || ""} />
                                    <AvatarFallback className="bg-indigo-100 text-indigo-600">
                                      {student.name.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm font-medium text-gray-900">{student.name}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">{student.enrollmentId}</td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <Badge 
                                  className={
                                    student.enrollmentStatus === "ACTIVE" 
                                      ? "bg-green-100 text-green-800" 
                                      : student.enrollmentStatus === "DROPPED" 
                                        ? "bg-red-100 text-red-800" 
                                        : "bg-yellow-100 text-yellow-800"
                                  }
                                >
                                  {student.enrollmentStatus}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-600">
                                {new Date(student.enrolledAt).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex justify-between items-center mt-6">
                        <p className="text-sm text-gray-500">
                          Showing {indexOfFirstStudent + 1}-{Math.min(indexOfLastStudent, courseDetails.students.length)} of {courseDetails.students.length} students
                        </p>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage - 1)}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            <span className="sr-only">Previous</span>
                          </Button>
                          <div className="text-sm text-gray-500">
                            Page {currentPage} of {totalPages}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                            <span className="sr-only">Next</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Schedule Tab */}
          <TabsContent value="schedule">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 text-indigo-500 mr-2" />
                  Weekly Schedule
                </CardTitle>
                <CardDescription>
                  Class schedule for subjects you teach in this course
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {courseDetails.schedules.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No schedules have been created for your subjects.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 border-b">
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Day</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                          <th className="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {courseDetails.schedules
                          .sort((a, b) => {
                            // Order by day of week
                            const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
                            const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
                            if (dayDiff !== 0) return dayDiff;
                            
                            // Then by start time
                            return a.startTime.localeCompare(b.startTime);
                          })
                          .map((schedule) => (
                            <tr key={schedule.id} className="hover:bg-gray-50">
                              <td className="py-3 px-4 whitespace-nowrap">
                                <Badge 
                                  variant="outline"
                                  className={
                                    schedule.day === "Monday" ? "bg-blue-50 text-blue-600" :
                                    schedule.day === "Tuesday" ? "bg-green-50 text-green-600" :
                                    schedule.day === "Wednesday" ? "bg-purple-50 text-purple-600" :
                                    schedule.day === "Thursday" ? "bg-amber-50 text-amber-600" :
                                    schedule.day === "Friday" ? "bg-pink-50 text-pink-600" :
                                    schedule.day === "Saturday" ? "bg-indigo-50 text-indigo-600" :
                                    "bg-gray-50 text-gray-600"
                                  }
                                >
                                  {schedule.day}
                                </Badge>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 text-gray-400 mr-2" />
                                  <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap">
                                <div>
                                  <p className="text-sm font-medium text-gray-900">{schedule.subjectName}</p>
                                  {schedule.subjectCode && (
                                    <p className="text-xs text-gray-500">{schedule.subjectCode}</p>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-4 whitespace-nowrap text-sm">
                                <div className="flex items-center">
                                  <MapPin className="h-4 w-4 text-gray-400 mr-2" />
                                  <span>{schedule.room}</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
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
