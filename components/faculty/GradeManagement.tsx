"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AssessmentForm from "@/components/faculty/AssessmentForm";
import GradeEntryTable from "@/components/faculty/GradeEntryTable";
import { FolderPlus, FileText } from "lucide-react";

interface GradeManagementProps {
  facultyId: string;
}

export default function GradeManagement({ facultyId }: GradeManagementProps) {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<string>("");
  const [isCreatingAssessment, setIsCreatingAssessment] = useState(false);
  const [activeTab, setActiveTab] = useState("assessments");

  // Fetch faculty subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/faculty/subjects?facultyId=${facultyId}`);
        if (!response.ok) throw new Error("Failed to fetch subjects");
        
        const data = await response.json();
        setSubjects(data.subjects || []);
      } catch (error) {
        console.error("Error fetching subjects:", error);
      } finally {
        setLoading(false);
      }
    };

    if (facultyId) {
      fetchSubjects();
    }
  }, [facultyId]);

  // Fetch assessments when subject is selected
  useEffect(() => {
    const fetchAssessments = async () => {
      if (!selectedSubject) {
        setAssessments([]);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`/api/faculty/assessments?subjectId=${selectedSubject}`);
        if (!response.ok) throw new Error("Failed to fetch assessments");
        
        const data = await response.json();
        setAssessments(data.assessments || []);
      } catch (error) {
        console.error("Error fetching assessments:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [selectedSubject]);

  // Handle assessment creation
  const handleAssessmentCreated = (newAssessment: any) => {
    setAssessments([...assessments, newAssessment]);
    setIsCreatingAssessment(false);
    setSelectedAssessment(newAssessment.id);
    setActiveTab("grades");
  };

  // Format subject name to include course and section
  const formatSubjectName = (subject: any) => {
    return `${subject.code}: ${subject.name} (${subject.section?.name || 'No Section'})`;
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Grade Management</h1>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Subject Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Subject</CardTitle>
            <CardDescription>
              Choose a subject to manage grades and assessments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedSubject}
              onValueChange={(value) => {
                setSelectedSubject(value);
                setSelectedAssessment("");
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {formatSubjectName(subject)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedSubject && (
          <Card>
            <CardHeader>
              <CardTitle>
                {subjects.find((s) => s.id === selectedSubject)?.name}
              </CardTitle>
              <CardDescription>
                {subjects.find((s) => s.id === selectedSubject)?.section?.name || "No Section"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="assessments"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="assessments">Assessments</TabsTrigger>
                  <TabsTrigger value="grades">Enter Grades</TabsTrigger>
                </TabsList>

                <TabsContent value="assessments">
                  {loading ? (
                    <LoadingSpinner message="Loading assessments..." />
                  ) : (
                    <div>
                      {isCreatingAssessment ? (
                        <AssessmentForm
                          subjectId={selectedSubject}
                          onCancel={() => setIsCreatingAssessment(false)}
                          onCreated={handleAssessmentCreated}
                        />
                      ) : (
                        <div>
                          <div className="flex justify-end mb-4">
                            <Button
                              onClick={() => setIsCreatingAssessment(true)}
                              className="ml-auto"
                            >
                              <FolderPlus className="mr-2 h-4 w-4" />
                              Create Assessment
                            </Button>
                          </div>

                          {assessments.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-md">
                              <FileText className="mx-auto h-12 w-12 text-gray-400" />
                              <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No assessments
                              </h3>
                              <p className="mt-1 text-sm text-gray-500">
                                Get started by creating a new assessment.
                              </p>
                            </div>
                          ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                              {assessments.map((assessment) => (
                                <Card 
                                  key={assessment.id} 
                                  className={`cursor-pointer hover:border-purple-400 transition-colors ${selectedAssessment === assessment.id ? 'border-purple-500 ring-1 ring-purple-500' : ''}`}
                                  onClick={() => {
                                    setSelectedAssessment(assessment.id);
                                    setActiveTab("grades");
                                  }}
                                >
                                  <CardHeader className="pb-2">
                                    <CardTitle className="text-lg">{assessment.title}</CardTitle>
                                    <CardDescription>
                                      {assessment.type} ({assessment.maxMarks} marks)
                                    </CardDescription>
                                  </CardHeader>
                                  <CardContent>
                                    <div className="text-sm">
                                      <p>
                                        <span className="font-medium">Weightage:</span>{" "}
                                        {assessment.weightage}%
                                      </p>
                                      {assessment.dueDate && (
                                        <p>
                                          <span className="font-medium">Due:</span>{" "}
                                          {new Date(assessment.dueDate).toLocaleDateString()}
                                        </p>
                                      )}
                                      <p className="mt-1 text-gray-500 truncate">
                                        {assessment._count?.marks || 0} students graded
                                      </p>
                                    </div>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="grades">
                  {!selectedAssessment ? (
                    <div className="text-center py-12 bg-gray-50 rounded-md">
                      <h3 className="text-sm font-medium text-gray-900">
                        Please select an assessment first
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Select or create an assessment to enter grades.
                      </p>
                      <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => setActiveTab("assessments")}
                      >
                        Go to Assessments
                      </Button>
                    </div>
                  ) : (
                    <GradeEntryTable
                      assessmentId={selectedAssessment}
                      subjectId={selectedSubject}
                    />
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
