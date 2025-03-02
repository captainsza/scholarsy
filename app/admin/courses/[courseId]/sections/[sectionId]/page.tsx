"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import EnrolledStudentsList from "@/components/admin/courses/EnrolledStudentsList";
import SubjectsList from "@/components/admin/courses/SubjectsList";
import SchedulesList from "@/components/admin/courses/SchedulesList";

// Define proper types for page params
interface SectionDetailsPageProps {
  params: {
    courseId: string;
    sectionId: string;
  };
}

// Type for the section data
interface Section {
  id: string;
  name: string;
  academicTerm: string;
  capacity: number;
  course: {
    id: string;
    name: string;
    code: string;
  };
  enrollments: any[];
  subjects: any[];
  schedules: any[];
}

export default function SectionDetailsPage({ params }: SectionDetailsPageProps) {
  const router = useRouter();
  const { courseId, sectionId } = params;
  
  const [loading, setLoading] = useState<boolean>(true);
  const [section, setSection] = useState<Section | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchSectionDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/sections/${sectionId}`);
        
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

    fetchSectionDetails();
  }, [sectionId]);

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading section details..." />
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

  if (!section) {
    return (
      <AdminLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-yellow-50 p-4 rounded-md">
            <p className="text-yellow-700">Section not found.</p>
            <Button 
              onClick={() => router.push(`/admin/courses/${courseId}`)}
              className="mt-4"
              variant="outline"
            >
              Back to Course
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
                onClick={() => router.push(`/admin/courses/${courseId}`)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">{section.name}</h1>
              <Badge variant="outline" className="ml-2">
                {section.academicTerm}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {section.course.name} ({section.course.code})
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/courses/${courseId}/sections/${sectionId}/enroll`)}
            >
              Enroll Students
            </Button>
            <Button
              onClick={() => router.push(`/admin/courses/${courseId}/sections/${sectionId}/subjects/create`)}
            >
              Add Subject
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Section Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">Course</p>
                <p className="mt-1 text-sm text-gray-900">{section.course.name} ({section.course.code})</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Academic Term</p>
                <p className="mt-1 text-sm text-gray-900">{section.academicTerm}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">Capacity</p>
                <p className="mt-1 text-sm text-gray-900">
                  {section.enrollments?.length || 0} / {section.capacity}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="students" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="students">Students ({section.enrollments?.length || 0})</TabsTrigger>
            <TabsTrigger value="subjects">Subjects ({section.subjects?.length || 0})</TabsTrigger>
            <TabsTrigger value="schedules">Schedules</TabsTrigger>
          </TabsList>
          
          <TabsContent value="students">
            <EnrolledStudentsList 
              enrollments={section.enrollments || []} 
              sectionId={sectionId} 
            />
          </TabsContent>
          
          <TabsContent value="subjects">
            <SubjectsList 
              subjects={section.subjects || []} 
              sectionId={sectionId}
              courseId={courseId}
            />
          </TabsContent>
          
          <TabsContent value="schedules">
            <SchedulesList 
              sectionId={sectionId} 
              schedules={section.schedules || []}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
