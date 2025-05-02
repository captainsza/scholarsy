"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toastall";
import { 
  ArrowLeft, 
  Calendar, 
  Download, 
  FileText, 
  Clock, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Search,
  Users,
  Edit,
  BarChart3,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { format, formatDistance } from "date-fns";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface AssessmentStudent {
  id: string;
  name: string;
  enrollmentId: string;
  profileImage?: string;
  submission?: {
    id: string;
    marksObtained: number;
    feedback?: string;
    submittedAt?: string;
    evaluatedAt?: string;
    fileUrl?: string;
  };
}

interface AssessmentDetails {
  id: string;
  title: string;
  type: string;
  maxMarks: number;
  weightage: number;
  dueDate?: string;
  instructions?: string;
  attachmentUrl?: string;
  createdAt: string;
  subject: {
    id: string;
    name: string;
    code: string;
    course: {
      id: string;
      name: string;
      branch: string;
      year: string;
      semester: string;
    };
  };
  students: AssessmentStudent[];
  stats: {
    totalStudents: number;
    submittedCount: number;
    gradedCount: number;
    averageMarks: number;
  };
}

export default function AssessmentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<AssessmentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredStudents, setFilteredStudents] = useState<AssessmentStudent[]>([]);
  
  // Grading state
  const [selectedStudent, setSelectedStudent] = useState<AssessmentStudent | null>(null);
  const [marks, setMarks] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [gradingLoading, setGradingLoading] = useState(false);

  // Fetch assessment details
  useEffect(() => {
    const fetchAssessmentDetails = async () => {
      if (!user?.faculty?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/faculty/assessments/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch assessment details");
        }
        
        const data = await response.json();
        setAssessment(data.assessment);
        setFilteredStudents(data.assessment.students);
      } catch (err: any) {
        console.error("Error fetching assessment details:", err);
        setError(err.message || "Failed to load assessment details");
        toast({
          title: "Error",
          description: "Failed to load assessment details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAssessmentDetails();
  }, [id, user]);

  // Filter students when search query changes
  useEffect(() => {
    if (!assessment) return;
    
    if (!searchQuery.trim()) {
      setFilteredStudents(assessment.students);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = assessment.students.filter(
      student => 
        student.name.toLowerCase().includes(query) ||
        student.enrollmentId.toLowerCase().includes(query)
    );
    
    setFilteredStudents(filtered);
  }, [searchQuery, assessment]);

  // Handle grading a submission
  const handleGradeSubmission = async () => {
    if (!selectedStudent) return;
    
    try {
      setGradingLoading(true);
      
      const parsedMarks = parseFloat(marks);
      if (isNaN(parsedMarks) || parsedMarks < 0 || parsedMarks > assessment!.maxMarks) {
        toast({
          title: "Invalid marks",
          description: `Marks must be between 0 and ${assessment!.maxMarks}`,
          variant: "destructive",
        });
        return;
      }
      
      const response = await fetch(`/api/faculty/assessments/${id}/grade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudent.id,
          marksObtained: parsedMarks,
          feedback,
          markId: selectedStudent.submission?.id
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to grade submission");
      }
      
      const data = await response.json();
      
      // Update the student data in the state
      setAssessment(prevAssessment => {
        if (!prevAssessment) return null;
        
        const updatedStudents = prevAssessment.students.map(student => {
          if (student.id === selectedStudent.id) {
            return {
              ...student,
              submission: {
                id: data.gradedSubmission.id,
                marksObtained: data.gradedSubmission.marksObtained,
                feedback: data.gradedSubmission.feedback,
                evaluatedAt: new Date().toISOString(),
                submittedAt: student.submission?.submittedAt,
                fileUrl: student.submission?.fileUrl
              }
            };
          }
          return student;
        });
        
        // Update stats
        const gradedCount = updatedStudents.filter(s => s.submission?.evaluatedAt).length;
        const totalMarks = updatedStudents.reduce((sum, student) => 
          sum + (student.submission?.marksObtained || 0), 0);
        const averageMarks = gradedCount > 0 ? totalMarks / gradedCount : 0;
        
        return {
          ...prevAssessment,
          students: updatedStudents,
          stats: {
            ...prevAssessment.stats,
            gradedCount,
            averageMarks
          }
        };
      });
      
      // Update filtered students as well
      setFilteredStudents(prevFilteredStudents => {
        return prevFilteredStudents.map(student => {
          if (student.id === selectedStudent.id) {
            return {
              ...student,
              submission: {
                id: data.gradedSubmission.id,
                marksObtained: data.gradedSubmission.marksObtained,
                feedback: data.gradedSubmission.feedback,
                evaluatedAt: new Date().toISOString(),
                submittedAt: student.submission?.submittedAt,
                fileUrl: student.submission?.fileUrl
              }
            };
          }
          return student;
        });
      });
      
      toast({
        title: "Success",
        description: "Submission graded successfully",
      });
      
      // Reset the grading form
      setSelectedStudent(null);
      setMarks("");
      setFeedback("");
    } catch (err: any) {
      console.error("Error grading submission:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to grade submission",
        variant: "destructive",
      });
    } finally {
      setGradingLoading(false);
    }
  };

  if (loading) {
    return (
      <FacultyLayout>
        <LoadingSpinner message="Loading assessment details..." />
      </FacultyLayout>
    );
  }

  if (error) {
    return (
      <FacultyLayout>
        <div className="p-8 flex flex-col items-center justify-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Assessment</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </FacultyLayout>
    );
  }

  if (!assessment) {
    return (
      <FacultyLayout>
        <div className="p-8 flex flex-col items-center justify-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Assessment Not Found</h1>
          <p className="text-gray-600 mb-6">The assessment you're looking for doesn't exist or you don't have permission to view it.</p>
          <Button onClick={() => router.push('/faculty/assessments')}>
            Go to Assessments
          </Button>
        </div>
      </FacultyLayout>
    );
  }

  const isPastDue = assessment.dueDate && new Date(assessment.dueDate) < new Date();
  const submissionRate = assessment.stats.totalStudents > 0 
    ? (assessment.stats.submittedCount / assessment.stats.totalStudents) * 100 
    : 0;
  const gradedRate = assessment.stats.submittedCount > 0 
    ? (assessment.stats.gradedCount / assessment.stats.submittedCount) * 100 
    : 0;

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/faculty/assessments')}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
              <p className="text-gray-500">
                {assessment.subject.code}: {assessment.subject.name} | {assessment.subject.course.name}
              </p>
            </div>
          </div>
            <Badge variant={
            assessment.type === 'QUIZ' ? 'info' :
            assessment.type === 'ASSIGNMENT' ? 'default' :
            assessment.type === 'MIDTERM' || assessment.type === 'FINAL' ? 'success' :
            'outline'
            } className="text-sm">
            {assessment.type.charAt(0) + assessment.type.slice(1).toLowerCase()}
            </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Main Assessment Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Assessment Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Maximum Marks</p>
                    <p className="text-lg font-semibold text-gray-900">{assessment.maxMarks} points</p>
                  </div>
                  {assessment.weightage > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Weightage</p>
                      <p className="text-lg font-semibold text-gray-900">{assessment.weightage}%</p>
                    </div>
                  )}
                  {assessment.dueDate && (
                    <div>
                      <p className="text-sm font-medium text-gray-500">Due Date</p>
                      <p className={`text-lg font-semibold ${isPastDue ? 'text-red-600' : 'text-gray-900'}`}>
                        {format(new Date(assessment.dueDate), 'PPP')}
                        {isPastDue && ' (Past due)'}
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500">Created</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {format(new Date(assessment.createdAt), 'PPP')}
                    </p>
                  </div>
                </div>

                {assessment.instructions && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Instructions</p>
                    <p className="mt-1 text-gray-700 whitespace-pre-wrap">{assessment.instructions}</p>
                  </div>
                )}

                {assessment.attachmentUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500">Assessment Materials</p>
                    <div className="mt-2">
                      <a 
                        href={assessment.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FileText className="h-4 w-4 mr-2 text-indigo-500" />
                        Download Materials
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Submission Tabs */}
            <Card>
              <CardHeader>
                <CardTitle>Student Submissions</CardTitle>
                <div className="flex justify-between items-center">
                  <CardDescription>
                    {assessment.stats.submittedCount} out of {assessment.stats.totalStudents} students have submitted
                  </CardDescription>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input 
                      className="pl-9 w-64" 
                      placeholder="Search students..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Submission Date</TableHead>
                        <TableHead>Marks</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                            {searchQuery ? "No students match your search." : "No students are enrolled in this course."}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student, index) => (
                          <TableRow key={student.id} 
                            className={
                              student.submission?.submittedAt ? 
                                student.submission?.evaluatedAt ? 
                                  "bg-green-50" : 
                                  "bg-blue-50" 
                                : ""
                            }
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <span className="text-indigo-600 font-medium">{student.name[0]}</span>
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{student.name}</div>
                                  <div className="text-xs text-gray-500">{student.enrollmentId}</div>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.submission ? (
                                student.submission.evaluatedAt ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    Graded
                                  </Badge>
                                ) : (
                                  <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                    Submitted
                                  </Badge>
                                )
                              ) : (
                                isPastDue ? (
                                  <Badge variant="destructive">Missing</Badge>
                                ) : (
                                  <Badge variant="outline">Pending</Badge>
                                )
                              )}
                            </TableCell>
                            <TableCell>
                              {student.submission?.submittedAt ? (
                                <div className="flex items-center text-xs text-gray-500">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {formatDistance(new Date(student.submission.submittedAt), new Date(), { addSuffix: true })}
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {student.submission?.evaluatedAt ? (
                                <span className="font-medium">
                                  {student.submission.marksObtained} / {assessment.maxMarks}
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {student.submission?.submittedAt && (
                                <div className="flex justify-end gap-2">
                                  {student.submission.fileUrl && (
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => window.open(student.submission?.fileUrl, "_blank")}
                                    >
                                      <Download className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        size="sm" 
                                        variant={student.submission.evaluatedAt ? "outline" : "default"}
                                        onClick={() => {
                                          setSelectedStudent(student);
                                          setMarks(student.submission?.marksObtained?.toString() || "");
                                          setFeedback(student.submission?.feedback || "");
                                        }}
                                      >
                                        {student.submission.evaluatedAt ? (
                                          <>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit
                                          </>
                                        ) : (
                                          <>
                                            <CheckCircle2 className="h-4 w-4 mr-2" />
                                            Grade
                                          </>
                                        )}
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-lg">
                                      <DialogHeader>
                                        <DialogTitle>
                                          {student.submission.evaluatedAt ? "Edit Grading" : "Grade Submission"}
                                        </DialogTitle>
                                        <DialogDescription>
                                          {student.name} ({student.enrollmentId})
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-4 py-4">
                                        <div className="space-y-2">
                                          <Label htmlFor="marks">
                                            Marks (out of {assessment.maxMarks})
                                          </Label>
                                          <Input
                                            id="marks"
                                            type="number"
                                            min="0"
                                            max={assessment.maxMarks.toString()}
                                            step="0.1"
                                            value={marks}
                                            onChange={(e) => setMarks(e.target.value)}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label htmlFor="feedback">Feedback (optional)</Label>
                                          <Textarea
                                            id="feedback"
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            rows={4}
                                            placeholder="Provide feedback to the student..."
                                          />
                                        </div>
                                      </div>
                                      <DialogFooter>
                                        <Button variant="outline" onClick={() => {
                                          setSelectedStudent(null);
                                          setMarks("");
                                          setFeedback("");
                                        }}>
                                          Cancel
                                        </Button>
                                        <Button 
                                          onClick={handleGradeSubmission}
                                          disabled={gradingLoading}
                                        >
                                          {gradingLoading ? (
                                            <>
                                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                              Saving...
                                            </>
                                          ) : student.submission.evaluatedAt ? (
                                            "Update Grade"
                                          ) : (
                                            "Submit Grade"
                                          )}
                                        </Button>
                                      </DialogFooter>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Analytics */}
          <div className="space-y-6">
            {/* Statistics Card */}
            <Card>
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Submission Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Submissions</span>
                    <span>
                      {assessment.stats.submittedCount}/{assessment.stats.totalStudents}
                      <span className="text-gray-500 ml-1">
                        ({Math.round(submissionRate)}%)
                      </span>
                    </span>
                  </div>
                  <Progress value={submissionRate} className="h-2" />
                </div>
                
                {/* Grading Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Grading Progress</span>
                    <span>
                      {assessment.stats.gradedCount}/{assessment.stats.submittedCount}
                      <span className="text-gray-500 ml-1">
                        ({Math.round(gradedRate)}%)
                      </span>
                    </span>
                  </div>
                  <Progress value={gradedRate} className="h-2" />
                </div>

                {/* Average Score */}
                {assessment.stats.gradedCount > 0 && (
                  <div className="pt-2 border-t">
                    <p className="text-sm font-medium">Average Score</p>
                    <div className="flex items-end gap-2 mt-1">
                      <p className="text-2xl font-bold">
                        {assessment.stats.averageMarks.toFixed(1)}
                      </p>
                      <p className="text-sm text-gray-500 pb-1">
                        / {assessment.maxMarks} points
                      </p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ 
                          width: `${(assessment.stats.averageMarks / assessment.maxMarks) * 100}%` 
                        }} 
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Download All Submissions
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Export Grades
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Message Students
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </FacultyLayout>
  );
}
