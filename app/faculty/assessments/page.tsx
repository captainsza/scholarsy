"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Search,
  Plus,
  FileText,
  Filter,
  Clock,
  CalendarIcon,
  CheckCircle2,
  AlertCircle,
  Trash2
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow, format, parseISO, isAfter } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface Assessment {
  id: string;
  title: string;
  type: string;
  maxMarks: number;
  weightage: number;
  dueDate: string | null;
  instructions: string | null;
  attachmentUrl: string | null;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  courseName: string;
  submissionCount: number;
  totalStudents: number;
  isOverdue: boolean;
}

interface Subject {
  id: string;
  name: string;
  code: string;
}

export default function FacultyAssessmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");

  useEffect(() => {
    if (!user?.faculty?.id) return;

    const fetchAssessments = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch assessments
        const response = await fetch(`/api/faculty/assessments?facultyId=${user.faculty.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch assessments");
        }
        
        const data = await response.json();
        setAssessments(data.assessments || []);
        
        // Fetch subjects (for filtering)
        const subjectsResponse = await fetch(`/api/faculty/subjects?facultyId=${user.faculty.id}`);
        
        if (!subjectsResponse.ok) {
          throw new Error("Failed to fetch subjects");
        }
        
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
      } catch (err: any) {
        console.error("Error fetching assessments:", err);
        setError(err.message || "Failed to load assessments");
        toast({
          title: "Error",
          description: "Failed to load assessments. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssessments();
  }, [user]);

  const handleDeleteAssessment = async (id: string) => {
    try {
      if (!confirm("Are you sure you want to delete this assessment? This action cannot be undone.")) {
        return;
      }
      
      const response = await fetch(`/api/faculty/assessments/${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete assessment");
      }
      
      // Remove from state
      setAssessments(assessments.filter(assessment => assessment.id !== id));
      
      toast({
        title: "Success",
        description: "Assessment deleted successfully.",
      });
    } catch (err: any) {
      console.error("Error deleting assessment:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to delete assessment",
        variant: "destructive",
      });
    }
  };

  // Apply filters and sorting to assessments
  const filteredAssessments = assessments
    .filter(assessment => {
      const matchesSearch = 
        assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.courseName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterType === "all" || assessment.type === filterType;
      
      const matchesSubject = filterSubject === "all" || assessment.subjectId === filterSubject;
      
      const matchesStatus = filterStatus === "all" || 
        (filterStatus === "overdue" && assessment.isOverdue) ||
        (filterStatus === "upcoming" && !assessment.isOverdue) ||
        (filterStatus === "graded" && assessment.submissionCount > 0);
      
      return matchesSearch && matchesType && matchesSubject && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortBy === "title") {
        return a.title.localeCompare(b.title);
      } else if (sortBy === "submissions") {
        return b.submissionCount - a.submissionCount;
      } else {
        return 0;
      }
    });

  // Count assessments by type
  const assessmentCounts = {
    total: filteredAssessments.length,
    quiz: filteredAssessments.filter(a => a.type === "QUIZ").length,
    assignment: filteredAssessments.filter(a => a.type === "ASSIGNMENT").length,
    exam: filteredAssessments.filter(a => ["MIDTERM", "FINAL"].includes(a.type)).length,
    other: filteredAssessments.filter(a => !["QUIZ", "ASSIGNMENT", "MIDTERM", "FINAL"].includes(a.type)).length
  };

  // Group assessments by status
  const assessmentsByDeadline = {
    overdue: filteredAssessments.filter(a => a.isOverdue),
    upcoming: filteredAssessments.filter(a => !a.isOverdue && a.dueDate),
    noDeadline: filteredAssessments.filter(a => !a.dueDate)
  };

  if (loading) {
    return (
      <FacultyLayout>
        <LoadingSpinner message="Loading assessments..." />
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assessments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create and manage your assignments, quizzes, and exams
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Button onClick={() => router.push('/faculty/assessments/create')} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Create New Assessment
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-gray-50 to-gray-100">
            <CardContent className="pt-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Assessments</p>
                  <p className="text-2xl font-bold text-gray-900">{assessmentCounts.total}</p>
                </div>
                <FileText className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-600">Assignments</p>
                  <p className="text-2xl font-bold text-blue-700">{assessmentCounts.assignment}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="pt-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-purple-600">Quizzes</p>
                  <p className="text-2xl font-bold text-purple-700">{assessmentCounts.quiz}</p>
                </div>
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-600">Exams</p>
                  <p className="text-2xl font-bold text-green-700">{assessmentCounts.exam}</p>
                </div>
                <FileText className="h-8 w-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab navigation */}
        <Tabs defaultValue="all" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Assessments</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past Due</TabsTrigger>
          </TabsList>

          {/* All Assessments Tab */}
          <TabsContent value="all">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle>Assessment List</CardTitle>
                <CardDescription>View and manage all your assessments</CardDescription>
              </CardHeader>
              
              {/* Filters */}
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                      className="pl-9" 
                      placeholder="Search assessments..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    <Select 
                      value={filterType} 
                      onValueChange={setFilterType}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="QUIZ">Quiz</SelectItem>
                        <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                        <SelectItem value="MIDTERM">Midterm</SelectItem>
                        <SelectItem value="FINAL">Final</SelectItem>
                        <SelectItem value="PROJECT">Project</SelectItem>
                        <SelectItem value="PRESENTATION">Presentation</SelectItem>
                        <SelectItem value="LAB">Lab</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={filterSubject} 
                      onValueChange={setFilterSubject}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by subject" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Subjects</SelectItem>
                        {subjects.map(subject => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.code} - {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <Select 
                      value={sortBy} 
                      onValueChange={setSortBy}
                    >
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dueDate">Due Date</SelectItem>
                        <SelectItem value="title">Title</SelectItem>
                        <SelectItem value="submissions">Submissions</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filteredAssessments.length === 0 ? (
                  <div className="text-center py-10">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900">No assessments found</h3>
                    <p className="text-gray-500 mt-2">
                      {searchQuery || filterSubject !== "all" || filterType !== "all" 
                        ? "Try adjusting your search or filters"
                        : "You haven't created any assessments yet"}
                    </p>
                    <Button onClick={() => router.push('/faculty/assessments/create')} className="mt-4">
                      Create Your First Assessment
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead>Assessment</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Deadline</TableHead>
                          <TableHead className="text-center">Submissions</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAssessments.map((assessment) => (
                          <TableRow key={assessment.id} className="hover:bg-gray-50">
                            <TableCell>
                              <Link href={`/faculty/assessments/${assessment.id}`} className="block">
                                <div className="font-medium text-blue-600 hover:text-blue-800 hover:underline">
                                  {assessment.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1 flex items-center">
                                  Max Marks: {assessment.maxMarks}{" "}
                                  {assessment.weightage > 0 && `• Weight: ${assessment.weightage}%`}
                                </div>
                              </Link>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                assessment.type === 'QUIZ' ? 'purple' :
                                assessment.type === 'ASSIGNMENT' ? 'blue' :
                                assessment.type === 'MIDTERM' || assessment.type === 'FINAL' ? 'green' :
                                'outline'
                              }>
                                {assessment.type.charAt(0) + assessment.type.slice(1).toLowerCase()}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{assessment.subjectCode}</div>
                              <div className="text-xs text-gray-500">{assessment.courseName}</div>
                            </TableCell>
                            <TableCell>
                              {assessment.dueDate ? (
                                <div className={`flex items-center ${assessment.isOverdue ? 'text-red-600' : 'text-gray-700'}`}>
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  <span>
                                    {formatDistanceToNow(new Date(assessment.dueDate), { addSuffix: true })}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-500">No deadline</span>
                              )}
                            </TableCell>
                            <TableCell className="text-center">
                              <span className="font-medium">
                                {assessment.submissionCount}/{assessment.totalStudents}
                              </span>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button
                                  onClick={() => router.push(`/faculty/assessments/${assessment.id}`)}
                                  size="sm"
                                  variant="outline"
                                >
                                  View
                                </Button>
                                <Button
                                  onClick={() => handleDeleteAssessment(assessment.id)}
                                  size="sm"
                                  variant="outline"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Upcoming Tab */}
          <TabsContent value="upcoming">
            <div className="space-y-6">
              {assessmentsByDeadline.upcoming.length === 0 ? (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-gray-500">No upcoming assessments</p>
                  </CardContent>
                </Card>
              ) : (
                assessmentsByDeadline.upcoming
                  .sort((a, b) => {
                    if (!a.dueDate || !b.dueDate) return 0;
                    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                  })
                  .map(assessment => (
                    <Card key={assessment.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>
                            <Link href={`/faculty/assessments/${assessment.id}`} className="hover:text-blue-600 hover:underline">
                              {assessment.title}
                            </Link>
                          </CardTitle>
                          <Badge variant="outline">
                            {assessment.type.charAt(0) + assessment.type.slice(1).toLowerCase()}
                          </Badge>
                        </div>
                        <CardDescription>
                          {assessment.subjectCode} • {assessment.courseName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-gray-700 mb-3">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Due {assessment.dueDate && formatDistanceToNow(new Date(assessment.dueDate), { addSuffix: true })}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Submissions</span>
                            <span className="font-medium">{assessment.submissionCount}/{assessment.totalStudents}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full" 
                              style={{ 
                                width: `${assessment.totalStudents > 0 
                                  ? (assessment.submissionCount / assessment.totalStudents) * 100 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between bg-gray-50">
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => router.push(`/faculty/assessments/${assessment.id}`)}
                        >
                          View Details
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteAssessment(assessment.id)}
                        >
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>

          {/* Past Due Tab */}
          <TabsContent value="past">
            <div className="space-y-6">
              {assessmentsByDeadline.overdue.length === 0 ? (
                <Card className="bg-gray-50">
                  <CardContent className="pt-6 pb-6 text-center">
                    <p className="text-gray-500">No past due assessments</p>
                  </CardContent>
                </Card>
              ) : (
                assessmentsByDeadline.overdue
                  .sort((a, b) => {
                    if (!a.dueDate || !b.dueDate) return 0;
                    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
                  })
                  .map(assessment => (
                    <Card key={assessment.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle>
                            <Link href={`/faculty/assessments/${assessment.id}`} className="hover:text-blue-600 hover:underline">
                              {assessment.title}
                            </Link>
                          </CardTitle>
                          <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200">
                            {assessment.type.charAt(0) + assessment.type.slice(1).toLowerCase()}
                          </Badge>
                        </div>
                        <CardDescription>
                          {assessment.subjectCode} • {assessment.courseName}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center text-red-600 mb-3">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>Due {assessment.dueDate && formatDistanceToNow(new Date(assessment.dueDate), { addSuffix: true })}</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Submissions</span>
                            <span className="font-medium">{assessment.submissionCount}/{assessment.totalStudents}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className={`${assessment.submissionCount === assessment.totalStudents ? 'bg-green-600' : 'bg-amber-600'} h-2.5 rounded-full`}
                              style={{ 
                                width: `${assessment.totalStudents > 0 
                                  ? (assessment.submissionCount / assessment.totalStudents) * 100 
                                  : 0}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between bg-gray-50">
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="text-blue-600"
                          onClick={() => router.push(`/faculty/assessments/${assessment.id}`)}
                        >
                          View Submissions
                        </Button>
                        <Button 
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => handleDeleteAssessment(assessment.id)}
                        >
                          Delete
                        </Button>
                      </CardFooter>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}
