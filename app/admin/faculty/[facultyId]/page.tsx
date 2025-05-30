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
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  BookOpen,
  Users,
  ClipboardList,
  GraduationCap,
  BarChart3,
  Edit,
  ArrowLeft,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";

interface FacultyDetailPageProps {
  params: {
    facultyId: string;
  };
}

export default function AdminFacultyDetailPage({ params }: FacultyDetailPageProps) {
  const { facultyId } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacultyDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/admin/faculty/${facultyId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Faculty not found");
          } else {
            throw new Error("Failed to fetch faculty details");
          }
        }
        
        const data = await response.json();
        setFacultyData(data.faculty);
      } catch (err: any) {
        console.error("Error fetching faculty details:", err);
        setError(err.message || "Failed to load faculty details");
        toast({
          title: "Error",
          description: "Failed to load faculty details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetails();
  }, [facultyId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner message="Loading faculty details..." />
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

  // Format time string (e.g., "14:30" to "2:30 PM")
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      return `${hour % 12 || 12}:${minutes} ${period}`;
    } catch {
      return timeString;
    }
  };

  // Group schedule by day of week
  const scheduleByDay = facultyData.schedules?.reduce((acc: any, schedule: any) => {
    if (!acc[schedule.dayOfWeek]) {
      acc[schedule.dayOfWeek] = [];
    }
    acc[schedule.dayOfWeek].push(schedule);
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push("/admin/faculty")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Faculty
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Profile</h1>
          </div>
          <Button
            onClick={() => router.push(`/admin/faculty/${facultyId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </div>

        {/* Faculty Details with tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">
              <Briefcase className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="schedule">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </TabsTrigger>
            <TabsTrigger value="statistics">
              <BarChart3 className="h-4 w-4 mr-2" />
              Statistics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Profile Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Faculty Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                    <Avatar className="h-24 w-24">
                      <AvatarImage
                        src={facultyData.user?.profile?.profileImage || ""}
                        alt={`${facultyData.user?.profile?.firstName || ""} ${facultyData.user?.profile?.lastName || ""}`}
                      />
                      <AvatarFallback className="text-2xl">
                        {facultyData.user?.profile?.firstName?.[0] || ""}
                        {facultyData.user?.profile?.lastName?.[0] || ""}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {facultyData.user?.profile?.firstName} {facultyData.user?.profile?.lastName}
                      </h3>
                      <p className="text-gray-500">{facultyData.department}</p>
                      <div className="flex items-center mt-2 text-gray-500">
                        <Mail className="h-4 w-4 mr-1" />
                        {facultyData.user?.email}
                      </div>
                      {facultyData.user?.profile?.phone && (
                        <div className="flex items-center mt-1 text-gray-500">
                          <Phone className="h-4 w-4 mr-1" />
                          {facultyData.user.profile.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Account Information</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">Faculty ID</div>
                          <div className="text-sm font-mono">{facultyData.id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Department</div>
                          <div className="text-sm font-semibold">{facultyData.department}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Email Verified</div>
                          <div>
                            <Badge variant={facultyData.user?.emailVerified ? "success" : "destructive"}>
                              {facultyData.user?.emailVerified ? "Verified" : "Not Verified"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Account Status</div>
                          <div>
                            <Badge variant={facultyData.user?.isApproved ? "success" : "destructive"}>
                              {facultyData.user?.isApproved ? "Approved" : "Pending Approval"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Teaching Information</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">Courses Teaching</div>
                          <div className="text-sm">
                            {facultyData.subjects?.length || 0} subjects
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Created At</div>
                          <div className="text-sm">
                            {new Date(facultyData.user?.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Quick Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Teaching Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium">Subjects</div>
                        <div className="text-sm text-gray-500">{facultyData.subjects?.length || 0}</div>
                      </div>
                      <Progress value={Math.min((facultyData.subjects?.length || 0) * 10, 100)} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm font-medium">Students</div>
                        <div className="text-sm text-gray-500">
                          {facultyData.totalStudents || "N/A"}
                        </div>
                      </div>
                      <Progress value={Math.min((facultyData.totalStudents || 0) / 2, 100)} className="h-2" />
                    </div>
                    
                    <div className="pt-4 border-t mt-4">
                      <div className="flex justify-between items-center mb-1">
                        <div className="text-sm font-medium">Upcoming Classes</div>
                        <div className="text-sm text-gray-500">
                          {facultyData.upcomingClasses?.length || 0}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full mt-2"
                        onClick={() => (document.querySelector('[data-state="inactive"][data-value="schedule"]') as HTMLElement)?.click()}
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        View Schedule
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Teaching Assignments</CardTitle>
                <CardDescription>
                  Courses and subjects assigned to this faculty member
                </CardDescription>
              </CardHeader>
              <CardContent>
                {facultyData.subjects && facultyData.subjects.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Subject Code
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Name
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Course
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Credit Hours
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Students
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {facultyData.subjects.map((subject: any) => (
                          <tr key={subject.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {subject.code}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {subject.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {subject.course?.name || "N/A"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {subject.creditHours}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {subject.studentsCount || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    No courses currently assigned to this faculty member.
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Assessments</CardTitle>
                  <CardDescription>Recent and upcoming assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  {facultyData.assessments && facultyData.assessments.length > 0 ? (
                    <div className="space-y-4">
                      {facultyData.assessments.slice(0, 5).map((assessment: any) => (
                        <div key={assessment.id} className="border rounded-md p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{assessment.title}</h4>
                              <p className="text-sm text-gray-500">
                                {assessment.subject?.code}: {assessment.subject?.name}
                              </p>
                            </div>
                            <Badge>
                              {assessment.type}
                            </Badge>
                          </div>
                          <div className="mt-2 flex items-center text-sm">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>
                              Due: {new Date(assessment.dueDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No assessments found.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Course Coordinators</CardTitle>
                  <CardDescription>Courses coordinated by this faculty</CardDescription>
                </CardHeader>
                <CardContent>
                  {facultyData.coordinatedCourses && facultyData.coordinatedCourses.length > 0 ? (
                    <div className="space-y-3">
                      {facultyData.coordinatedCourses.map((course: any) => (
                        <div key={course.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                          <div>
                            <p className="font-medium">{course.name}</p>
                            <p className="text-sm text-gray-500">
                              {course.subjects?.length || 0} subjects • {course.enrollments?.length || 0} students
                            </p>
                          </div>
                          <Badge variant="outline">Coordinator</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      Not coordinating any courses.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="schedule">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Teaching Schedule</CardTitle>
                <CardDescription>Classes and lab sessions schedule</CardDescription>
              </CardHeader>
              <CardContent>
                {facultyData.schedules && facultyData.schedules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map(day => (
                      <Card key={day}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">{day}</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {scheduleByDay && scheduleByDay[day] && scheduleByDay[day].length > 0 ? (
                            <div className="space-y-3">
                              {scheduleByDay[day].map((schedule: any, index: number) => (
                                <div key={index} className="border rounded-md p-3 bg-gray-50">
                                  <div className="font-medium">
                                    {schedule.courseName || schedule.subject?.name || "Class"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    Room: {schedule.roomName || "TBD"}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="py-4 text-center text-gray-500 text-sm">
                              No classes scheduled
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No schedule information available.
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="statistics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Statistics</CardTitle>
                  <CardDescription>Class attendance by subject</CardDescription>
                </CardHeader>
                <CardContent>
                  {facultyData.attendanceSummary && Object.keys(facultyData.attendanceSummary).length > 0 ? (
                    <div className="space-y-6">
                      {Object.entries(facultyData.attendanceSummary).map(([subject, stats]: [string, any]) => {
                        const total = stats.present + stats.absent + stats.late;
                        const presentPercentage = total > 0 ? (stats.present / total) * 100 : 0;
                        const absentPercentage = total > 0 ? (stats.absent / total) * 100 : 0;
                        const latePercentage = total > 0 ? (stats.late / total) * 100 : 0;
                        
                        return (
                          <div key={subject}>
                            <h4 className="text-sm font-medium mb-2">{subject}</h4>
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-green-600">Present</span>
                                  <span>{presentPercentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={presentPercentage} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-red-600">Absent</span>
                                  <span>{absentPercentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={absentPercentage} className="h-2" />
                              </div>
                              <div>
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="text-amber-600">Late</span>
                                  <span>{latePercentage.toFixed(1)}%</span>
                                </div>
                                <Progress value={latePercentage} className="h-2" />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No attendance data available.
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Performance</CardTitle>
                  <CardDescription>Student performance in assessments</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Performance data will appear here when available.
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Teaching Workload Distribution</CardTitle>
                <CardDescription>Hours allocation by course and subject</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Workload distribution chart will appear here.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
