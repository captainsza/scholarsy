"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import {
  ChevronLeft,
  Edit,
  Mail,
  Phone,
  MapPin,
  Calendar,
  BookOpen,
  User,
  GraduationCap,
  Users,
  Activity,
  Clock,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";

// Import child components when created
import StudentEnrollments from "@/components/admin/students/StudentEnrollments";
import StudentGrades from "@/components/admin/students/StudentGrades";
import StudentAttendance from "@/components/admin/students/StudentAttendance";

export default function StudentDetailPage({ params }: { params: { studentId: string } }) {
  const router = useRouter();
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/students/${params.studentId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch student details');
        }
        
        const data = await response.json();
        setStudent(data.student);
      } catch (error) {
        console.error('Error fetching student details:', error);
        toast({
          title: "Error",
          description: "Failed to load student details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [params.studentId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-full">
          <LoadingSpinner message="Loading student details..." />
        </div>
      </AdminLayout>
    );
  }

  if (!student) {
    return (
      <AdminLayout>
        <div className="p-8 max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Student Not Found</h2>
          <p className="text-gray-600 mb-6">The student you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => router.push('/admin/students')}>
            Back to Students
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/students')}
              className="flex items-center"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/students/${params.studentId}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Profile
            </Button>
            <Button
              onClick={() => router.push(`/admin/students/${params.studentId}/enroll`)}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Enroll in Courses
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Student Profile Card */}
          <Card className="xl:col-span-1">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={student.user?.profile?.profileImage} />
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-2xl">
                    {student.user?.profile?.firstName?.[0]}
                    {student.user?.profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
              <CardTitle className="text-2xl font-bold">
                {student.user?.profile?.firstName} {student.user?.profile?.lastName}
              </CardTitle>
              <p className="text-gray-500">{student.enrollmentId}</p>
              <Badge 
                variant="outline" 
                className="mt-2 bg-green-100 text-green-800 border-0"
              >
                {student.academicStatus || "Active"}
              </Badge>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.user?.email}</p>
                    <p className="text-xs text-gray-500">Email</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{student.user?.profile?.phone || "Not provided"}</p>
                    <p className="text-xs text-gray-500">Phone</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {[
                        student.address,
                        student.city,
                        student.state,
                        student.country,
                        student.pincode
                      ].filter(Boolean).join(", ") || "Address not provided"}
                    </p>
                    <p className="text-xs text-gray-500">Address</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {student.dob ? new Date(student.dob).toLocaleDateString() : "Not provided"}
                    </p>
                    <p className="text-xs text-gray-500">Date of Birth</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Academic Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Department</p>
                      <p className="text-sm font-medium text-gray-900">{student.department}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Semester</p>
                      <p className="text-sm font-medium text-gray-900">{student.currentSemester || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Batch</p>
                      <p className="text-sm font-medium text-gray-900">{student.admissionSession || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Course</p>
                      <p className="text-sm font-medium text-gray-900">{student.courseName || "N/A"}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500">Father's Name</p>
                      <p className="text-sm font-medium text-gray-900">{student.fatherName || "Not provided"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Mother's Name</p>
                      <p className="text-sm font-medium text-gray-900">{student.motherName || "Not provided"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Student Details Tabs */}
          <Card className="xl:col-span-2">
            <Tabs defaultValue="enrollment">
              <TabsList className="bg-gray-100 rounded-t-lg rounded-b-none h-auto p-0">
                <TabsTrigger 
                  value="enrollment" 
                  className="rounded-none py-3 data-[state=active]:bg-white"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Enrollments
                </TabsTrigger>
                <TabsTrigger 
                  value="grades" 
                  className="rounded-none py-3 data-[state=active]:bg-white"
                >
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Grades
                </TabsTrigger>
                <TabsTrigger 
                  value="attendance" 
                  className="rounded-none py-3 data-[state=active]:bg-white"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Attendance
                </TabsTrigger>
                <TabsTrigger 
                  value="activity" 
                  className="rounded-none py-3 data-[state=active]:bg-white"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Activity
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="enrollment" className="m-0">
                <div className="p-6">
                  <h2 className="text-lg font-medium mb-4">Course Enrollments</h2>
                  {student.courseEnrollments?.length > 0 ? (
                    <StudentEnrollments 
                      enrollments={student.courseEnrollments} 
                      studentId={student.id}
                    />
                  ) : (
                    <div className="text-center p-6 bg-gray-50 rounded-lg">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-gray-900 font-medium mb-1">No Enrollments Found</h3>
                      <p className="text-gray-500 mb-4">This student is not enrolled in any courses yet.</p>
                      <Button 
                        onClick={() => router.push(`/admin/students/${params.studentId}/enroll`)}
                      >
                        Enroll in Courses
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="grades" className="m-0">
                <div className="p-6">
                  <h2 className="text-lg font-medium mb-4">Academic Performance</h2>
                  <StudentGrades studentId={student.id} />
                </div>
              </TabsContent>
              
              <TabsContent value="attendance" className="m-0">
                <div className="p-6">
                  <h2 className="text-lg font-medium mb-4">Attendance Records</h2>
                  <StudentAttendance studentId={student.id} />
                </div>
              </TabsContent>
              
              <TabsContent value="activity" className="m-0">
                <div className="p-6">
                  <h2 className="text-lg font-medium mb-4">Recent Activity</h2>
                  <div className="text-center p-6 bg-gray-50 rounded-lg">
                    <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-gray-900 font-medium mb-1">Activity Log Coming Soon</h3>
                    <p className="text-gray-500">Student activity tracking will be available in the next update.</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
