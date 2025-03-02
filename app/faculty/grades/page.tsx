"use client";

import { useState, useEffect } from "react";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import GradeManagement from "@/components/faculty/GradeManagement";
import InternalMarksManagement from "@/components/faculty/InternalMarksManagement";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";

export default function FacultyGradesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [facultyId, setFacultyId] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.faculty) {
      setFacultyId(user.faculty.id);
      setLoading(false);
    } else if (user) {
      setLoading(false);
    }
  }, [user]);

  if (loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner message="Loading grade management..." />
        </div>
      </FacultyLayout>
    );
  }

  if (!facultyId) {
    return (
      <FacultyLayout>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <div className="p-8 bg-red-50 rounded-lg border border-red-200 text-center">
            <h2 className="text-xl font-medium text-red-700 mb-2">Access Error</h2>
            <p className="text-red-600">Faculty profile not found. Please contact an administrator.</p>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Grade Management</h1>
        
        <Tabs defaultValue="assessment-grades">
          <TabsList className="mb-6">
            <TabsTrigger value="assessment-grades">Assessment Grades</TabsTrigger>
            <TabsTrigger value="internal-marks">Internal Marks</TabsTrigger>
          </TabsList>
          
          <TabsContent value="assessment-grades">
            <GradeManagement facultyId={facultyId} />
          </TabsContent>
          
          <TabsContent value="internal-marks">
            <Card className="p-4 mb-6">
              <p className="text-gray-600">
                In this section, you can manage internal marks which include sessional exams and 
                attendance-based marks. These marks contribute to the student's final grade as per 
                the university's evaluation policy.
              </p>
            </Card>
            <InternalMarksManagement facultyId={facultyId} />
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}
