"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import CourseDetailsContent from "@/components/admin/CourseDetailsContent";
import SubjectsList from "@/components/admin/courses/SubjectsList";
import EnrolledStudentsList from "@/components/admin/courses/EnrolledStudentsList";
import SchedulesList from "@/components/admin/courses/SchedulesList";
import { toast } from "@/components/ui/toastall";

export default function CourseDetailsPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/courses/${params.courseId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch course: ${response.statusText}`);
        }
        
        const data = await response.json();
        setCourse(data.course);
      } catch (error: any) {
        console.error("Error fetching course details:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load course details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [params.courseId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner message="Loading course details..." />
        </div>
      </AdminLayout>
    );
  }

  if (!course) {
    return (
      <AdminLayout>
        <div className="p-8 max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Course Not Found</h2>
          <p className="text-gray-600 mb-6">The course you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push("/admin/courses")}>
            Back to Courses
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
                onClick={() => router.push("/admin/courses")}
              >
                Back
              </Button>
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {course.branch} • Year {course.year} • Semester {course.semester}
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${params.courseId}/edit`)}
            >
              Edit Course
            </Button>
            <Button
              onClick={() => router.push(`/admin/courses/${params.courseId}/subjects/create`)}
            >
              Add Subject
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${params.courseId}/enroll`)}
            >
              Enroll Students
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
                Course Details
              </TabsTrigger>
              <TabsTrigger value="subjects" className="rounded-none py-3 data-[state=active]:bg-white">
                Subjects ({course._count?.subjects || 0})
              </TabsTrigger>
              <TabsTrigger value="students" className="rounded-none py-3 data-[state=active]:bg-white">
                Enrolled Students ({course._count?.students || 0})
              </TabsTrigger>
              <TabsTrigger value="schedule" className="rounded-none py-3 data-[state=active]:bg-white">
                Schedule
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="details" className="p-0 m-0">
              <CourseDetailsContent course={course} />
            </TabsContent>
            
            <TabsContent value="subjects" className="p-0 m-0">
              <SubjectsList 
                courseId={params.courseId} 
                subjects={course.subjects} 
              />
            </TabsContent>
            
            <TabsContent value="students" className="p-0 m-0">
              <EnrolledStudentsList 
                courseId={params.courseId} 
                enrollments={course.enrollments} 
              />
            </TabsContent>
            
            <TabsContent value="schedule" className="p-0 m-0">
              <SchedulesList 
                courseId={params.courseId}
                schedules={course.schedules}
              />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </AdminLayout>
  );
}
