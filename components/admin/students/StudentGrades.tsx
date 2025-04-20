"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  FileSpreadsheet, 
  Filter, 
  Medal,
  Calendar,
  ChevronDown,
  Info,
  Download
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Type definitions
interface CourseGrade {
  id: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  semester: string;
  academicYear: string;
  finalGrade: string;
  gradePoint: number;
  percentage: number;
  assessments: {
    id: string;
    name: string;
    type: string;
    maxMarks: number;
    marksObtained: number;
    percentage: number;
    weight: number;
    contributionToFinal: number;
  }[];
}

interface StudentGradesProps {
  studentId: string;
}

// Grade display helpers
const getGradeColor = (grade: string) => {
  const gradeColors: Record<string, string> = {
    'A+': 'bg-green-100 text-green-800',
    'A': 'bg-green-100 text-green-800',
    'A-': 'bg-green-100 text-green-800',
    'B+': 'bg-blue-100 text-blue-800',
    'B': 'bg-blue-100 text-blue-800',
    'B-': 'bg-blue-100 text-blue-800',
    'C+': 'bg-yellow-100 text-yellow-800',
    'C': 'bg-yellow-100 text-yellow-800',
    'C-': 'bg-yellow-100 text-yellow-800',
    'D+': 'bg-orange-100 text-orange-800',
    'D': 'bg-orange-100 text-orange-800',
    'F': 'bg-red-100 text-red-800',
    'I': 'bg-gray-100 text-gray-800', // Incomplete
    'W': 'bg-gray-100 text-gray-800', // Withdrawn
  };
  
  return gradeColors[grade] || 'bg-gray-100 text-gray-800';
};

const getPercentageColor = (percentage: number) => {
  if (percentage >= 90) return 'text-green-600';
  if (percentage >= 80) return 'text-blue-600';
  if (percentage >= 70) return 'text-yellow-600';
  if (percentage >= 60) return 'text-orange-600';
  return 'text-red-600';
};

export default function StudentGrades({ studentId }: StudentGradesProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<CourseGrade[]>([]);
  const [filteredGrades, setFilteredGrades] = useState<CourseGrade[]>([]);
  const [semesters, setSemesters] = useState<string[]>([]);
  const [semesterFilter, setSemesterFilter] = useState<string>("all");
  const [totalCredits, setTotalCredits] = useState(0);
  const [cgpa, setCgpa] = useState(0);
  const [activeTab, setActiveTab] = useState("all-courses");

  // Fetch student grades
  useEffect(() => {
    const fetchGrades = async () => {
      if (!studentId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/students/${studentId}/grades`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch grades');
        }
        
        const data = await response.json();
        setGrades(data.grades || []);
        
        // Extract unique semesters for filtering
        const uniqueSemesters = [...new Set(data.grades.map((grade: CourseGrade) => 
          `${grade.academicYear} - ${grade.semester}`)
        )];
        setSemesters(uniqueSemesters);
        
        // Calculate CGPA
        if (data.summary) {
          setCgpa(data.summary.cgpa || 0);
          setTotalCredits(data.summary.totalCredits || 0);
        }
        
      } catch (error) {
        console.error('Error fetching grades:', error);
        setError('Failed to load grades data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchGrades();
  }, [studentId]);

  // Apply filters
  useEffect(() => {
    if (semesterFilter === "all") {
      setFilteredGrades(grades);
    } else {
      const [year, semester] = semesterFilter.split(' - ');
      setFilteredGrades(grades.filter(grade => 
        grade.academicYear === year && grade.semester === semester
      ));
    }
  }, [grades, semesterFilter]);

  // Calculate semester-wise GPA
  const semesterGPAs = semesters.map(semesterKey => {
    const [year, semester] = semesterKey.split(' - ');
    const semesterCourses = grades.filter(grade => 
      grade.academicYear === year && grade.semester === semester
    );
    
    // Simple GPA calculation (can be enhanced with credit hours)
    const totalPoints = semesterCourses.reduce((sum, course) => sum + course.gradePoint, 0);
    const gpa = semesterCourses.length > 0 ? totalPoints / semesterCourses.length : 0;
    
    return {
      semester: semesterKey,
      gpa: gpa.toFixed(2),
      courses: semesterCourses.length
    };
  });

  // Handle export grades
  const handleExportGrades = () => {
    toast({
      title: "Export started",
      description: "Student grades export initiated",
    });
    // Implement actual export functionality
  };

  if (loading) {
    return <LoadingSpinner message="Loading grades..." />;
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-red-50 rounded-md">
        <p className="text-red-600">{error}</p>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">CGPA</p>
                <p className="text-2xl font-bold">{cgpa.toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Medal className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Courses Taken</p>
                <p className="text-2xl font-bold">{grades.length}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Credits Earned</p>
                <p className="text-2xl font-bold">{totalCredits}</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <BarChart3 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Current Semester</p>
                <p className="text-2xl font-bold">{semesters.length > 0 ? semesters[0] : 'N/A'}</p>
              </div>
              <div className="p-3 rounded-full bg-amber-100 text-amber-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Academic Record</CardTitle>
              <CardDescription>Course-wise grade information</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={semesterFilter}
                onValueChange={setSemesterFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Filter by semester" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Semesters</SelectItem>
                  {semesters.map((semester) => (
                    <SelectItem key={semester} value={semester}>
                      {semester}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportGrades}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs 
            defaultValue={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="all-courses">All Courses</TabsTrigger>
              <TabsTrigger value="semester-gpa">Semester GPA</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all-courses">
              {filteredGrades.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Grades Found</h3>
                  <p className="text-gray-500">
                    {grades.length > 0 
                      ? "No grades match your filter criteria."
                      : "There are no grade records for this student yet."}
                  </p>
                  {grades.length > 0 && (
                    <Button variant="outline" className="mt-4" onClick={() => setSemesterFilter("all")}>
                      Reset Filters
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[300px]">Course</TableHead>
                        <TableHead>Semester</TableHead>
                        <TableHead>Grade</TableHead>
                        <TableHead>Percentage</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredGrades.map((grade) => (
                        <TableRow key={grade.id}>
                          <TableCell className="font-medium">
                            <div className="font-medium">{grade.courseName}</div>
                            <div className="text-xs text-gray-500">{grade.courseCode}</div>
                          </TableCell>
                          <TableCell>
                            {grade.academicYear} - {grade.semester}
                          </TableCell>
                          <TableCell>
                            <Badge className={`${getGradeColor(grade.finalGrade)}`}>
                              {grade.finalGrade}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-blue-600 h-2.5 rounded-full" 
                                  style={{ width: `${grade.percentage}%` }}
                                ></div>
                              </div>
                              <span className={`text-sm font-medium ${getPercentageColor(grade.percentage)}`}>
                                {grade.percentage.toFixed(1)}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Info className="mr-2 h-4 w-4" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Report
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="semester-gpa">
              <div className="space-y-6">
                {semesterGPAs.map((semGPA) => (
                  <Card key={semGPA.semester} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 py-3">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base font-medium">{semGPA.semester}</CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{semGPA.courses} courses</span>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Badge className={`${parseFloat(semGPA.gpa) >= 3.5 ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                  GPA: {semGPA.gpa}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Semester Grade Point Average</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {grades
                          .filter(grade => `${grade.academicYear} - ${grade.semester}` === semGPA.semester)
                          .map((grade) => (
                            <div key={grade.id} className="flex justify-between items-center p-3 border rounded-lg">
                              <div>
                                <p className="font-medium text-sm">{grade.courseName}</p>
                                <p className="text-xs text-gray-500">{grade.courseCode}</p>
                              </div>
                              <Badge className={`${getGradeColor(grade.finalGrade)}`}>
                                {grade.finalGrade}
                              </Badge>
                            </div>
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Performance Trends (optional) */}
      <Card>
        <CardHeader>
          <CardTitle>Grade Distribution</CardTitle>
          <CardDescription>Performance across different courses and semesters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">Grade distribution visualization will appear here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
