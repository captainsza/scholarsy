"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { 
  ArrowLeft, 
  Clock, 
  FileText, 
  Download, 
  Upload, 
  CheckCircle,
  AlertTriangle,
  Book,
  Calendar,
  User,
  FileUp,
  Loader2,
  XCircle
} from "lucide-react";
import { format, formatDistanceToNow, isAfter } from "date-fns";
import Link from "next/link";
import { Progress } from "@/components/ui/progress";

interface AssessmentDetail {
  id: string;
  title: string;
  type: string;
  maxMarks: number;
  weightage: number;
  dueDate: string | null;
  instructions: string | null;
  attachmentUrl: string | null;
  isPastDue: boolean;
  subject: {
    id: string;
    name: string;
    code: string;
  };
  course: {
    id: string;
    name: string;
  };
  faculty: {
    name: string;
  } | null;
  submission: {
    id: string;
    submittedAt: string;
    evaluatedAt: string | null;
    marksObtained: number | null;
    feedback: string | null;
    fileUrl: string | null;
  } | null;
}

export default function AssignmentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user } = useAuth();
  const [assessment, setAssessment] = useState<AssessmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [comments, setComments] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add this helper function to download files with proper filename/extension
  const downloadFile = async (url: string, fallbackName: string) => {
    try {
      // Get the filename from the URL
      const urlParts = url.split('/');
      let filename = urlParts[urlParts.length - 1];
      
      // Decode URL encoded characters
      filename = decodeURIComponent(filename);
      
      // If filename doesn't have extension or has query parameters, use fallback
      if (!filename.includes('.') || filename.includes('?')) {
        filename = fallbackName;
      }
      
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: "Error",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch assessment details
  useEffect(() => {
    const fetchAssessmentDetails = async () => {
      if (!user?.student?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/student/assessments/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch assignment details");
        }
        
        const data = await response.json();
        setAssessment(data.assessment);
        
        if (data.assessment.submission?.feedback) {
          setComments(data.assessment.submission.feedback);
        }
      } catch (err: any) {
        console.error("Error fetching assessment details:", err);
        setError(err.message || "Failed to load assessment details");
        toast({
          title: "Error",
          description: "Failed to load assignment details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssessmentDetails();
  }, [id, user]);

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  // Handle submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!assessment || !user?.student?.id) return;
    
    try {
      setSubmitting(true);
      
      // Check if there's already a submission and no new file is selected
      if (assessment.submission && !file) {
        // If no new file, just update the comments
        toast({
          title: "No changes detected",
          description: "Please select a file to update your submission",
          variant: "default",
        });
        setSubmitting(false);
        return;
      }
      
      // If past due, confirm with the user
      if (assessment.isPastDue && !assessment.submission && !confirm("This assignment is past due. Submit anyway?")) {
        setSubmitting(false);
        return;
      }
      
      const formData = new FormData();
      formData.append("assessmentId", assessment.id);
      
      if (comments) {
        formData.append("comments", comments);
      }
      
      if (file) {
        formData.append("submissionFile", file);
      }
      
      const response = await fetch("/api/student/assessments/submit", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit assignment");
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: data.message || "Assignment submitted successfully",
      });
      
      // Refresh the page to show updated submission
      router.refresh();
      
      // Update local state to reflect the submission without refreshing
      setAssessment(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          submission: {
            id: data.submission.id,
            submittedAt: data.submission.submittedAt,
            evaluatedAt: null,
            marksObtained: null,
            feedback: comments || null,
            fileUrl: data.submission.fileUrl
          }
        };
      });
      
      // Reset form
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err: any) {
      console.error("Error submitting assignment:", err);
      toast({
        title: "Error",
        description: err.message || "Failed to submit assignment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <LoadingSpinner message="Loading assignment details..." />
      </StudentLayout>
    );
  }

  if (error || !assessment) {
    return (
      <StudentLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" /> Back to Assignments
            </Button>
            <div className="bg-red-50 p-4 rounded-md">
              <div className="flex">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-2">{error || "Assignment not found"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  const isSubmitted = !!assessment.submission;
  const isGraded = !!assessment.submission?.evaluatedAt;
  const isPastDue = assessment.isPastDue;
  const canSubmit = !isGraded; // Can submit if not graded yet
  
  return (
    <StudentLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        {/* Header with back button */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => router.back()} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Assignments
          </Button>
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{assessment.title}</h1>
              <p className="mt-1 text-gray-500">
                {assessment.subject.code}: {assessment.subject.name} | {assessment.course.name}
              </p>
            </div>
            <div>
              <Badge 
              variant={
                assessment.type === 'ASSIGNMENT' ? 'default' :
                assessment.type === 'QUIZ' ? 'warning' :
                assessment.type === 'PROJECT' ? 'info' :
                assessment.type === 'MIDTERM' || assessment.type === 'FINAL' ? 'success' :
                'outline'
              }
              className="mt-2 md:mt-0"
              >
              {assessment.type.charAt(0) + assessment.type.slice(1).toLowerCase()}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* Status banner */}
        {isGraded && (
          <div className="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <div className="ml-3">
                <p className="text-sm text-green-700">
                  This assignment has been graded. Your grade is <strong>{assessment.submission?.marksObtained} out of {assessment.maxMarks}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isSubmitted && !isGraded && (
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-400 p-4 rounded-md">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-blue-400" />
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Submission received on {format(new Date(assessment.submission!.submittedAt), "PPP 'at' p")}.
                  Your work is awaiting evaluation.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {isPastDue && !isSubmitted && (
          <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <p className="text-sm text-red-700">
                  This assignment is past due. It was due {assessment.dueDate && 
                    formatDistanceToNow(new Date(assessment.dueDate), { addSuffix: true })}.
                  Late submissions may be penalized.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Assessment details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-blue-500" />
                  Assignment Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Assessment info */}
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
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Due Date</p>
                    <div className={`text-lg font-semibold flex items-center ${isPastDue ? 'text-red-600' : 'text-gray-900'}`}>
                      <Calendar className={`h-4 w-4 mr-1 ${isPastDue ? 'text-red-500' : 'text-gray-500'}`} />
                      {assessment.dueDate ? format(new Date(assessment.dueDate), 'PPP') : 'No due date'}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500">Instructor</p>
                    <div className="text-lg font-semibold text-gray-900 flex items-center">
                      <User className="h-4 w-4 mr-1 text-gray-500" />
                      {assessment.faculty?.name || 'Not assigned'}
                    </div>
                  </div>
                </div>
                
                {/* Instructions */}
                {assessment.instructions && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Instructions</p>
                    <div className="bg-gray-50 p-4 rounded-md text-gray-800 prose prose-sm max-w-none">
                      {assessment.instructions.split('\n').map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Download attachment */}
                {assessment.attachmentUrl && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Assignment Materials</p>
                    <Button 
                      variant="outline" 
                      onClick={() => downloadFile(
                        assessment.attachmentUrl!, 
                        `${assessment.title.replace(/\s+/g, '_')}_materials.pdf`
                      )}
                      className="w-full sm:w-auto flex items-center"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download Assignment Materials
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Submission form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-blue-500" />
                  {isSubmitted ? 'Your Submission' : 'Submit Your Work'}
                </CardTitle>
                {!isGraded && (
                  <CardDescription>
                    {isSubmitted ? 'You can update your submission until it is graded' : 'Upload your completed assignment'}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                {isGraded ? (
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="font-medium text-gray-700 mb-2">Your Submission</p>
                      {assessment.submission?.fileUrl ? (
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (assessment.submission?.fileUrl) {
                              downloadFile(
                                assessment.submission.fileUrl, 
                                `${assessment.title.replace(/\s+/g, '_')}_submission.pdf`
                              );
                            }
                          }}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download Your Submission
                        </Button>
                      ) : (
                        <p className="text-gray-500">No file was submitted.</p>
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Instructor Feedback</p>
                      <div className="bg-gray-50 p-4 rounded-md text-gray-800">
                        {assessment.submission?.feedback ? (
                          <p>{assessment.submission.feedback}</p>
                        ) : (
                          <p className="text-gray-500 italic">No feedback provided.</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <p className="font-medium text-gray-700 mb-1">Your Score</p>
                      <div className="mt-2">
                        <div className="flex justify-between mb-1 text-sm font-medium">
                          <span>{assessment.submission?.marksObtained ?? 0} out of {assessment.maxMarks}</span>
                          <span>{Math.round(((assessment.submission?.marksObtained ?? 0) / assessment.maxMarks) * 100)}%</span>
                        </div>
                        <Progress 
                          value={((assessment.submission?.marksObtained ?? 0) / assessment.maxMarks) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Upload your work
                      </label>
                      <div className="border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center">
                        <input
                          type="file"
                          id="file-upload"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="file-upload"
                          className="cursor-pointer flex flex-col items-center"
                        >
                          <FileUp className="h-10 w-10 text-gray-400 mb-3" />
                          <span className="text-sm font-medium text-blue-600">Click to upload</span>
                          <p className="text-xs text-gray-500 mt-1">
                            PDF, Word, Excel files (Max 10MB)
                          </p>
                        </label>
                      </div>
                      
                      {file && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <FileText className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="truncate">{file.name}</span>
                          <span className="ml-2">({(file.size / (1024 * 1024)).toFixed(2)} MB)</span>
                          <button
                            type="button"
                            className="ml-2 text-red-600 hover:text-red-800"
                            onClick={() => {
                              setFile(null);
                              if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                              }
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      
                      {isSubmitted && !file && (
                          <div className="mt-2 flex items-center text-sm text-gray-600">
                            <FileText className="h-4 w-4 mr-2 text-gray-400" />
                            <span>Previously submitted file</span>
                            {assessment.submission?.fileUrl && (
                              <Button 
                                type="button"
                                variant="link" 
                                className="ml-1 p-0 h-auto text-blue-600" 
                                onClick={() => assessment.submission?.fileUrl && 
                                  downloadFile(
                                    assessment.submission.fileUrl, 
                                    `${assessment.title.replace(/\s+/g, '_')}_submission.pdf`
                                  )
                                }
                              >
                                View
                              </Button>
                            )}
                          </div>
                        )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Comments (optional)
                      </label>
                      <Textarea
                        value={comments}
                        onChange={(e) => setComments(e.target.value)}
                        placeholder="Add any comments about your submission..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full sm:w-auto"
                        disabled={submitting || (!file && !isSubmitted)}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                          </>
                        ) : isSubmitted ? (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Update Submission
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Submit Assignment
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Submission Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <Badge 
                      variant={
                      isGraded ? "success" : 
                      isSubmitted ? "info" : 
                      isPastDue ? "destructive" : 
                      "outline"
                      }
                    >
                      {isGraded ? "Graded" : 
                       isSubmitted ? "Submitted" :
                       isPastDue ? "Past Due" : 
                       "Not Submitted"}
                    </Badge>
                  </div>
                  
                  {assessment.dueDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Due Date</span>
                      <span className={`text-sm font-medium ${isPastDue ? 'text-red-600' : 'text-gray-900'}`}>
                        {format(new Date(assessment.dueDate), 'PP')}
                      </span>
                    </div>
                  )}
                  
                  {isSubmitted && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Submitted</span>
                      <span className="text-sm font-medium text-gray-900">
                        {format(new Date(assessment.submission!.submittedAt), 'PP')}
                      </span>
                    </div>
                  )}
                  
                  {isGraded && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Grade</span>
                      <span className="text-sm font-medium text-gray-900">
                        {assessment.submission!.marksObtained} / {assessment.maxMarks}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Helpful Resources</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Link 
                    href={`/student/subjects/${assessment.subject.id}`} 
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <Book className="h-4 w-4 mr-2" />
                    <span className="text-sm">Go to Subject Page</span>
                  </Link>
                  
                  <Link 
                    href="/student/grades" 
                    className="flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="text-sm">View All Grades</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
