"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Plus, 
  Trash2, 
  UserPlus, 
  Users 
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CourseDetailsPageProps {
  params: {
    courseId: string;
  },
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { courseId } = params;
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [course, setCourse] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/courses/${courseId}`);
        
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

    fetchCourseDetails();
  }, [courseId]);

  const toggleSectionExpand = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (expandedSections.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleDeleteCourse = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/courses/${courseId}`, {
        method: "DELETE"
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to delete course");
      }
      
      router.push("/admin/courses");
    } catch (err: any) {
      setError(err.message || "Failed to delete course");
      setIsDeleteDialogOpen(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading course details..." />
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={() => router.back()}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-yellow-700">Course not found.</p>
            <Button 
              onClick={() => router.push("/admin/courses")}
              className="mt-4"
              variant="outline"
            >
              Back to Courses
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
          <div>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => router.push("/admin/courses")}
                className="text-gray-500 hover:text-gray-700"
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
              {course.department} • {course.credits} Credits
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${courseId}/edit`)}
            >
              <Edit size={16} className="mr-2" />
              Edit Course
            </Button>
            <Button
              onClick={() => router.push(`/admin/courses/${courseId}/sections/create`)}
              variant="default"
            >
              <Plus size={16} className="mr-2" />
              Add Section
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Course details with tabs */}
        <Tabs 
          defaultValue="overview" 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sections">Sections ({course.sections?.length || 0})</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
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
                      <dt className="text-sm font-medium text-gray-500">Department</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.department}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Credits</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.credits}</dd>
                    </div>
                    <div className="sm:col-span-2">
                      <dt className="text-sm font-medium text-gray-500">Description</dt>
                      <dd className="mt-1 text-sm text-gray-900">{course.description || "No description available."}</dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Course Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Sections</p>
                      <p className="mt-1 text-2xl font-semibold">{course.sections?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Registrations</p>
                      <p className="mt-1 text-2xl font-semibold">{course._count?.registrations || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Faculty</p>
                      <p className="mt-1">
                        {course.faculty ? (
                          <span className="inline-flex items-center">
                            <span className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium mr-2">
                              {course.faculty.user.profile.firstName[0]}
                              {course.faculty.user.profile.lastName[0]}
                            </span>
                            {course.faculty.user.profile.firstName} {course.faculty.user.profile.lastName}
                          </span>
                        ) : (
                          <Badge variant="outline">No Faculty Assigned</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {course.sections && course.sections.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Latest Sections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Section Name</TableHead>
                          <TableHead>Academic Term</TableHead>
                          <TableHead>Capacity</TableHead>
                          <TableHead>Subjects</TableHead>
                          <TableHead>Students</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {course.sections.slice(0, 5).map((section: any) => (
                          <TableRow key={section.id}>
                            <TableCell className="font-medium">{section.name}</TableCell>
                            <TableCell>{section.academicTerm}</TableCell>
                            <TableCell>{section._count?.enrollments || 0}/{section.capacity}</TableCell>
                            <TableCell>{section._count?.subjects || 0}</TableCell>
                            <TableCell>
                              <Badge variant={section._count?.enrollments > 0 ? "default" : "outline"}>
                                {section._count?.enrollments || 0}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => router.push(`/admin/courses/${courseId}/sections/${section.id}`)}
                                >
                                  View
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {course.sections.length > 5 && (
                    <div className="mt-4 text-center">
                      <Button 
                        variant="outline" 
                        onClick={() => setActiveTab("sections")}
                      >
                        View All Sections
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="sections">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Course Sections</CardTitle>
                  <CardDescription>Manage all sections for {course.name}</CardDescription>
                </div>
                <Button onClick={() => router.push(`/admin/courses/${courseId}/sections/create`)}>
                  <Plus size={16} className="mr-2" />
                  Add Section
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {course.sections && course.sections.length > 0 ? (
                    course.sections.map((section: any) => (
                      <Card key={section.id} className="overflow-hidden">
                        <div 
                          className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer hover:bg-gray-100"
                          onClick={() => toggleSectionExpand(section.id)}
                        >
                          <div>
                            <h3 className="font-medium text-lg">{section.name}</h3>
                            <p className="text-sm text-gray-500">
                              {section.academicTerm} • {section._count?.enrollments || 0}/{section.capacity} students
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/courses/${courseId}/sections/${section.id}/subjects/create`);
                              }}
                            >
                              Add Subject
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/admin/courses/${courseId}/sections/${section.id}/enroll`);
                              }}
                            >
                              <UserPlus size={16} className="mr-2" />
                              Enroll Students
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSectionExpand(section.id);
                              }}
                            >
                              {expandedSections.has(section.id) ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </Button>
                          </div>
                        </div>

                        {expandedSections.has(section.id) && (
                          <div className="p-4 border-t">
                            <Tabs defaultValue="subjects" className="w-full">
                              <TabsList>
                                <TabsTrigger value="subjects">Subjects</TabsTrigger>
                                <TabsTrigger value="students">Students</TabsTrigger>
                              </TabsList>
                              
                              <TabsContent value="subjects" className="mt-4">
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Code</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Credit Hours</TableHead>
                                        <TableHead>Faculty</TableHead>
                                        <TableHead>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {section.subjects && section.subjects.length > 0 ? (
                                        section.subjects.map((subject: any) => (
                                          <TableRow key={subject.id}>
                                            <TableCell className="font-medium">{subject.code}</TableCell>
                                            <TableCell>{subject.name}</TableCell>
                                            <TableCell>{subject.creditHours}</TableCell>
                                            <TableCell>
                                              {subject.faculty ? (
                                                <div className="flex items-center space-x-1">
                                                  <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
                                                    {subject.faculty.user.profile.firstName[0]}
                                                    {subject.faculty.user.profile.lastName[0]}
                                                  </div>
                                                  <span className="text-sm">
                                                    {subject.faculty.user.profile.firstName} {subject.faculty.user.profile.lastName}
                                                  </span>
                                                </div>
                                              ) : (
                                                <Badge variant="outline">Not Assigned</Badge>
                                              )}
                                            </TableCell>
                                            <TableCell>
                                              <Button 
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => router.push(`/admin/subjects/${subject.id}/edit`)}
                                              >
                                                Edit
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                            No subjects added to this section yet
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                                
                                <div className="mt-4">
                                  <Link href={`/admin/courses/${courseId}/sections/${section.id}/subjects/create`}>
                                    <Button variant="outline" size="sm">
                                      <Plus size={16} className="mr-1" />
                                      Add Subject
                                    </Button>
                                  </Link>
                                </div>
                              </TabsContent>
                              
                              <TabsContent value="students" className="mt-4">
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Enrollment ID</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Enrolled On</TableHead>
                                        <TableHead>Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {section.enrollments && section.enrollments.length > 0 ? (
                                        section.enrollments.map((enrollment: any) => (
                                          <TableRow key={enrollment.id}>
                                            <TableCell className="font-medium">{enrollment.student.enrollmentId}</TableCell>
                                            <TableCell>
                                              {enrollment.student.user.profile.firstName} {enrollment.student.user.profile.lastName}
                                            </TableCell>
                                            <TableCell>
                                              <Badge 
                                                variant={enrollment.status === "ACTIVE" ? "success" : 
                                                        enrollment.status === "DROPPED" ? "destructive" : "default"}
                                              >
                                                {enrollment.status}
                                              </Badge>
                                            </TableCell>
                                            <TableCell>{new Date(enrollment.enrolledAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                              <Button 
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => router.push(`/admin/students/${enrollment.student.id}`)}
                                              >
                                                View
                                              </Button>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      ) : (
                                        <TableRow>
                                          <TableCell colSpan={5} className="text-center py-4 text-gray-500">
                                            No students enrolled in this section yet
                                          </TableCell>
                                        </TableRow>
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                                
                                <div className="mt-4">
                                  <Link href={`/admin/courses/${courseId}/sections/${section.id}/enroll`}>
                                    <Button variant="outline" size="sm">
                                      <UserPlus size={16} className="mr-1" />
                                      Enroll Students
                                    </Button>
                                  </Link>
                                </div>
                              </TabsContent>
                            </Tabs>
                            
                            <div className="mt-4 pt-4 border-t flex justify-end">
                              <Button 
                                variant="default"
                                size="sm"
                                onClick={() => router.push(`/admin/courses/${courseId}/sections/${section.id}`)}
                              >
                                View Full Section Details
                              </Button>
                            </div>
                          </div>
                        )}
                      </Card>
                    ))
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-gray-400" />
                      <h3 className="mt-4 text-lg font-medium text-gray-900">No sections yet</h3>
                      <p className="mt-2 text-sm text-gray-500">Create course sections to organize subjects and enroll students.</p>
                      <div className="mt-6">
                        <Button onClick={() => router.push(`/admin/courses/${courseId}/sections/create`)}>
                          Add First Section
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Course Analytics</CardTitle>
                <CardDescription>Enrollment trends and academic performance</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px] flex items-center justify-center">
                <p className="text-gray-500">Analytics dashboard coming soon</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you sure you want to delete this course?</DialogTitle>
          </DialogHeader>
          <p className="py-4">
            This action cannot be undone. This will permanently delete the {course.name} course
            and remove all associated data.
          </p>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteCourse} disabled={loading}>
              {loading ? "Deleting..." : "Delete Course"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
