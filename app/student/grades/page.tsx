"use client";

import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SubjectGradeList from "@/components/student/SubjectGradeList";
import AssessmentGradeList from "@/components/student/AssessmentGradeList";
import GradeProgressChart from "@/components/student/GradeProgressChart";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/toastall";

export default function StudentGradesPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [gradeData, setGradeData] = useState<any>(null);

  useEffect(() => {
    const fetchGradeData = async () => {
      if (!user?.student?.id) return;

      try {
        setLoading(true);
        // Fetch available semesters for this student
        const semesterResponse = await fetch(`/api/student/grades/semesters?studentId=${user.student.id}`);
        if (!semesterResponse.ok) throw new Error("Failed to fetch semesters");
        const semesterData = await semesterResponse.json();
        
        setSemesters(semesterData.semesters);
        
        // If semesters are available, set the latest one as default
        if (semesterData.semesters && semesterData.semesters.length > 0) {
          const latestSemester = semesterData.semesters[0]; // Assuming sorted by latest
          setSelectedSemester(latestSemester);
          
          // Fetch grades for the latest semester
          await fetchSemesterGrades(latestSemester);
        }
      } catch (error) {
        console.error("Error fetching grade data:", error);
        toast({
          title: "Error",
          description: "Failed to load your grades. Please try again later.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchGradeData();
  }, [user]);

  const fetchSemesterGrades = async (semester: string) => {
    if (!user?.student?.id) return;

    try {
      setLoading(true);
      const gradeResponse = await fetch(`/api/student/grades?studentId=${user.student.id}&semester=${semester}`);
      if (!gradeResponse.ok) throw new Error("Failed to fetch grades");
      const grades = await gradeResponse.json();
      
      setGradeData(grades);
    } catch (error) {
      console.error("Error fetching semester grades:", error);
      toast({
        title: "Error",
        description: "Failed to load grades for this semester.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSemesterChange = (semester: string) => {
    setSelectedSemester(semester);
    fetchSemesterGrades(semester);
  };

  if (loading && !gradeData) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner message="Loading grade information..." />
        </div>
      </StudentLayout>
    );
  }

  // Calculate overall GPA and CGPA
  const calculateGPA = () => {
    if (!gradeData?.subjects || gradeData.subjects.length === 0) {
      return { gpa: "N/A", totalCredits: 0 };
    }

    // Simple GPA calculation (can be adjusted based on your grading system)
    let totalPoints = 0;
    let totalCredits = 0;

    gradeData.subjects.forEach((subject: any) => {
      const { internalMarks, creditHours } = subject;
      if (internalMarks && internalMarks.totalMark !== undefined) {
        // Convert percentage to GPA points (example scale, adjust as needed)
        let gradePoint = 0;
        const percent = internalMarks.totalMark;
        
        if (percent >= 90) gradePoint = 4.0;
        else if (percent >= 80) gradePoint = 3.7;
        else if (percent >= 75) gradePoint = 3.3;
        else if (percent >= 70) gradePoint = 3.0;
        else if (percent >= 65) gradePoint = 2.7;
        else if (percent >= 60) gradePoint = 2.3;
        else if (percent >= 55) gradePoint = 2.0;
        else if (percent >= 50) gradePoint = 1.7;
        else if (percent >= 45) gradePoint = 1.3;
        else if (percent >= 40) gradePoint = 1.0;
        else gradePoint = 0.0;
        
        totalPoints += gradePoint * creditHours;
        totalCredits += creditHours;
      }
    });

    const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "N/A";
    
    return { gpa, totalCredits };
  };

  const { gpa, totalCredits } = calculateGPA();

  return (
    <StudentLayout>
      <div className="py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
          <h1 className="text-3xl font-bold text-gray-900">My Academic Performance</h1>
          
          {semesters.length > 0 && (
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">Select Semester:</span>
              <Select
                value={selectedSemester}
                onValueChange={handleSemesterChange}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select Semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Grade Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Semester GPA</CardTitle>
              <CardDescription>
                Current semester performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{gpa}</div>
              <div className="text-sm text-gray-500 mt-1">
                Based on {totalCredits} credit hours
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Completed Subjects</CardTitle>
              <CardDescription>
                For {selectedSemester}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">
                {gradeData?.subjects?.length || 0}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {totalCredits} total credit hours
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Overall Standing</CardTitle>
              <CardDescription>
                Academic performance
              </CardDescription>
            </CardHeader>
            <CardContent className="flex items-center">
              {gpa !== "N/A" && parseFloat(gpa as string) >= 3.5 ? (
                <Badge variant="success" className="h-fit text-base px-3 py-1">Excellent</Badge>
              ) : gpa !== "N/A" && parseFloat(gpa as string) >= 3.0 ? (
                <Badge variant="default" className="h-fit text-base px-3 py-1">Good</Badge>
              ) : gpa !== "N/A" && parseFloat(gpa as string) >= 2.0 ? (
                <Badge className="h-fit text-base px-3 py-1">Satisfactory</Badge>
              ) : (
                <Badge variant="destructive" className="h-fit text-base px-3 py-1">Needs Improvement</Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {/* Tab Navigation */}
          <Tabs defaultValue="subjects">
            <TabsList className="mb-6">
              <TabsTrigger value="subjects">Subject Grades</TabsTrigger>
              <TabsTrigger value="assessments">Assessment Grades</TabsTrigger>
              <TabsTrigger value="progress">Grade Progress</TabsTrigger>
            </TabsList>

            {/* Subject Grades Tab */}
            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle>Grades by Subject</CardTitle>
                  <CardDescription>
                    Detailed breakdown of your academic performance by subject
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {gradeData?.subjects && gradeData.subjects.length > 0 ? (
                    <SubjectGradeList subjects={gradeData.subjects} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No grade data available for this semester.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Assessment Grades Tab */}
            <TabsContent value="assessments">
              <Card>
                <CardHeader>
                  <CardTitle>Grades by Assessment</CardTitle>
                  <CardDescription>
                    View your performance across different assessment types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {gradeData?.assessments && gradeData.assessments.length > 0 ? (
                    <AssessmentGradeList assessments={gradeData.assessments} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No assessment data available for this semester.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Grade Progress Tab */}
            <TabsContent value="progress">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Progress</CardTitle>
                  <CardDescription>
                    Track your academic progress over time
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {gradeData?.progressData ? (
                    <GradeProgressChart data={gradeData.progressData} />
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Not enough data to display progress chart.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </StudentLayout>
  );
}
