"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { BookOpen, User, Users, Calendar, Trash2, Edit, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "@/components/ui/toastall";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SubjectData {
  id: string;
  name: string;
  code: string;
  description?: string;
  creditHours: number;
  courseId: string;
  facultyId?: string;
  course: {
    id: string;
    name: string;
    branch: string;
    year: string;
    semester: string;
  };
  faculty?: {
    id: string;
    department: string;
    user: {
      profile: {
        firstName: string;
        lastName: string;
        profileImage?: string;
      };
    };
  };
  assessments: Array<{
    id: string;
    title: string;
    type: string;
    maxMarks: number;
    dueDate?: string;
  }>;
  attendances: Array<any>;
}

interface EnrolledStudent {
  id: string;
  student: {
    id: string;
    enrollmentId: string;
    user: {
      profile: {
        firstName: string;
        lastName: string;
        profileImage?: string;
      };
    };
  };
}

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: {
    id: string;
    name: string;
  };
}

export default function SubjectDetailsPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter();
  const [subject, setSubject] = useState<SubjectData | null>(null);
  const [enrolledStudents, setEnrolledStudents] = useState<EnrolledStudent[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/subjects/${params.subjectId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch subject: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSubject(data.subject);
        setEnrolledStudents(data.enrolledStudents || []);
        setSchedules(data.schedules || []);
      } catch (error: any) {
        console.error("Error fetching subject details:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load subject details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjectDetails();
  }, [params.subjectId]);

  const handleDeleteSubject = async () => {
    if (!subject) return;
    
    try {
      setDeleting(true);
      const response = await fetch(`/api/admin/subjects/${subject.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject deleted successfully",
        });
        router.push(`/admin/courses/${subject.courseId}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete subject");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete subject",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };
  
  // Helper function to format time
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    } catch (error) {
      return time;
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner message="Loading subject details..." />
        </div>
      </AdminLayout>
    );
  }

  if (!subject) {
    return (
      <AdminLayout>
        <div className="p-8 max-w-xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Subject Not Found</h2>
          <p className="text-gray-600 mb-6">The subject you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push(`/admin/courses/${subject.courseId}`)}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Course
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{subject.name}</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              Code: {subject.code} • Credits: {subject.creditHours}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/subjects/${params.subjectId}/edit`)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit Subject
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Subject
            </Button>
          </div>
        </div>
        
        <Card>
          <Tabs
            defaultValue="details"
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="bg-gray-100 p-0 w-full justify-start rounded-t-lg rounded-b-none">
              <TabsTrigger value="details" className="rounded-none py-3 data-[state=active]:bg-white">
                Subject Details
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-none py-3 data-[state=active]:bg-white">
                Enrolled Students ({enrolledStudents.length})
              </TabsTrigger>
              <TabsTrigger value="assessments" className="rounded-none py-3 data-[state=active]:bg-white">
                Assessments ({subject.assessments.length})
              </TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-none py-3 data-[state=active]:bg-white">
                Schedule
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-6 m-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  {/* Subject Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Subject Information</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Subject Name</h4>
                        <p className="mt-1 text-sm text-gray-900">{subject.name}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Subject Code</h4>
                        <p className="mt-1 text-sm text-gray-900">{subject.code}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Credit Hours</h4>
                        <p className="mt-1 text-sm text-gray-900">{subject.creditHours}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500">Course</h4>
                        <p className="mt-1 text-sm text-gray-900">
                          <Button
                            variant="link"
                            className="p-0 h-auto"
                            onClick={() => router.push(`/admin/courses/${subject.courseId}`)}
                          >
                            {subject.course.name}
                          </Button>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {subject.description && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
                      <p className="text-sm text-gray-600 whitespace-pre-line">
                        {subject.description}
                      </p>
                    </div>
                  )}

                  {/* Course Information */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Course Information</h3>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Course Name</h4>
                          <p className="text-sm text-gray-900">{subject.course.name}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Branch</h4>
                          <p className="text-sm text-gray-900">{subject.course.branch}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Year</h4>
                          <p className="text-sm text-gray-900">{subject.course.year}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Semester</h4>
                          <p className="text-sm text-gray-900">{subject.course.semester}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Faculty Information */}
                <div>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg">Faculty Assigned</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {subject.faculty ? (
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-4">
                            <AvatarImage src={subject.faculty.user.profile?.profileImage || ""} />
                            <AvatarFallback className="bg-blue-100 text-blue-600">
                              {subject.faculty.user.profile?.firstName?.[0]}
                              {subject.faculty.user.profile?.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {subject.faculty.user.profile?.firstName} {subject.faculty.user.profile?.lastName}
                            </h4>
                            <p className="text-sm text-gray-500">{subject.faculty.department}</p>
                            <Button 
                              variant="link" 
                              className="p-0 h-auto text-blue-600"
                              onClick={() => router.push(`/admin/faculty/${subject.faculty?.id}`)}
                            >
                              View Profile
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <User className="mx-auto h-12 w-12 text-gray-300" />
                          <p className="mt-2 text-sm text-gray-500">No faculty assigned</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4"
                            onClick={() => router.push(`/admin/subjects/${params.subjectId}/edit`)}
                          >
                            Assign Faculty
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="students" className="p-0 m-0">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Enrolled Students</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/admin/courses/${subject.courseId}/enroll`)}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Enrollments
                  </Button>
                </div>
                
                {enrolledStudents.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Students Enrolled</h3>
                    <p className="text-gray-500 mb-4">There are no students enrolled in this subject yet.</p>
                    <Button
                      onClick={() => router.push(`/admin/courses/${subject.courseId}/enroll`)}
                    >
                      Enroll Students
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {enrolledStudents.map((enrollment) => (
                          <TableRow key={enrollment.id}>
                            <TableCell className="font-medium">
                              {enrollment.student.enrollmentId}
                            </TableCell>
                            <TableCell>
                              {enrollment.student.user.profile.firstName} {enrollment.student.user.profile.lastName}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/students/${enrollment.student.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="assessments" className="p-0 m-0">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Assessments</h3>
                  <Button
                    onClick={() => router.push(`/admin/subjects/${params.subjectId}/assessments/create`)}
                  >
                    Add Assessment
                  </Button>
                </div>
                
                {subject.assessments.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Assessments</h3>
                    <p className="text-gray-500 mb-4">There are no assessments created for this subject yet.</p>
                    <Button
                      onClick={() => router.push(`/admin/subjects/${params.subjectId}/assessments/create`)}
                    >
                      Create Assessment
                    </Button>
                  </div>
                ) : (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Max Marks</TableHead>
                          <TableHead>Due Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subject.assessments.map((assessment) => (
                          <TableRow key={assessment.id}>
                            <TableCell className="font-medium">
                              {assessment.title}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{assessment.type}</Badge>
                            </TableCell>
                            <TableCell>{assessment.maxMarks}</TableCell>
                            <TableCell>
                              {assessment.dueDate 
                                ? new Date(assessment.dueDate).toLocaleDateString() 
                                : "No deadline"}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => router.push(`/admin/assessments/${assessment.id}`)}
                              >
                                View
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="schedule" className="p-0 m-0">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Class Schedule</h3>
                  <Button
                    onClick={() => router.push(`/admin/courses/${subject.courseId}/schedule/create`)}
                  >
                    Add Schedule
                  </Button>
                </div>
                
                {schedules.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Schedule</h3>
                    <p className="text-gray-500 mb-4">There's no class schedule set for this subject yet.</p>
                    <Button
                      onClick={() => router.push(`/admin/courses/${subject.courseId}/schedule/create`)}
                    >
                      Create Schedule
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {schedules.map((schedule) => (
                      <Card key={schedule.id} className="overflow-hidden">
                        <CardHeader className="bg-blue-50 py-3">
                          <CardTitle className="text-sm font-medium text-blue-800">
                            {schedule.dayOfWeek}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="flex justify-between items-center mb-2">
                            <div className="text-gray-900 font-medium">
                              {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                            </div>
                          </div>
                          <div className="text-sm text-gray-500">
                            <span className="font-medium">Room:</span> {schedule.room?.name || "TBD"}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </div>

      {/* Delete Subject Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-md mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">
                This will remove the subject from the course and delete all related assessments.
              </p>
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-md mb-4">
            <h4 className="font-medium text-gray-900 mb-2">{subject.name}</h4>
            <p className="text-sm text-gray-600">
              Code: {subject.code} • Credits: {subject.creditHours}
            </p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete Subject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
