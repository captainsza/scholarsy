"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toastall";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ArrowLeft, Upload, FileUp, Calendar, Info, AlertTriangle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Subject {
  id: string;
  name: string;
  code: string;
  courseName: string;
}

export default function CreateAssessmentPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState("");
  const [type, setType] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [maxMarks, setMaxMarks] = useState("10");
  const [weightage, setWeightage] = useState("0");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [instructions, setInstructions] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch subjects assigned to the faculty
  useEffect(() => {
    if (!user?.faculty?.id) return;

    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/faculty/subjects?facultyId=${user?.faculty?.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch subjects");
        }
        
        const data = await response.json();  // Fixed: changed res to response
        
        // Transform data for select dropdown
        const subjectOptions = (data.subjects || []).map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          code: subject.code,
          courseName: subject.courseName || subject.course?.name || "Unknown Course"
        }));
        
        setSubjects(subjectOptions);
      } catch (err: any) {
        console.error("Error fetching subjects:", err);
        setError(err.message || "Failed to load subjects");
        toast({
          title: "Error",
          description: "Failed to load your subjects. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [user]);

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
      
      // Check file type (PDF, DOC, DOCX, XLS, XLSX)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a PDF, Word, or Excel file",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
    }
  };

  // Form validation
  const validateForm = () => {
    if (!title.trim()) {
      toast({
        title: "Missing title",
        description: "Please enter a title for the assessment",
        variant: "destructive",
      });
      return false;
    }
    
    if (!type) {
      toast({
        title: "Missing assessment type",
        description: "Please select an assessment type",
        variant: "destructive",
      });
      return false;
    }
    
    if (!subjectId) {
      toast({
        title: "Missing subject",
        description: "Please select a subject for the assessment",
        variant: "destructive",
      });
      return false;
    }
    
    const parsedMaxMarks = parseFloat(maxMarks);
    if (isNaN(parsedMaxMarks) || parsedMaxMarks <= 0) {
      toast({
        title: "Invalid marks",
        description: "Maximum marks must be a positive number",
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  // Submit assessment form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const formData = new FormData();
      formData.append("title", title);
      formData.append("type", type);
      formData.append("subjectId", subjectId);
      formData.append("maxMarks", maxMarks);
      formData.append("weightage", weightage);
      
      if (dueDate) {
        formData.append("dueDate", dueDate.toISOString());
      }
      
      if (instructions) {
        formData.append("instructions", instructions);
      }
      
      if (file) {
        formData.append("assessmentFile", file);
      }
      
      const response = await fetch("/api/faculty/assessments", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create assessment");
      }
      
      const data = await response.json();
      
      toast({
        title: "Success",
        description: "Assessment created successfully",
      });
      
      // Navigate to the assessment detail page
      router.push(`/faculty/assessments/${data.assessment.id}`);
    } catch (err: any) {
      console.error("Error creating assessment:", err);
      setError(err.message || "Failed to create assessment");
      toast({
        title: "Error",
        description: err.message || "Failed to create assessment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FacultyLayout>
        <LoadingSpinner message="Loading..." />
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Assessment</h1>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form Card */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Assessment Details</CardTitle>
                <CardDescription>
                  Create a new assessment for your students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {error && (
                  <div className="bg-red-50 p-4 rounded-md border border-red-200 flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-red-600 font-medium">Error</p>
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Midterm Examination, Assignment 1"
                    className="w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="type" className="text-base">
                      Assessment Type <span className="text-red-500">*</span>
                    </Label>
                    <Select value={type} onValueChange={setType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QUIZ">Quiz</SelectItem>
                        <SelectItem value="ASSIGNMENT">Assignment</SelectItem>
                        <SelectItem value="MIDTERM">Midterm</SelectItem>
                        <SelectItem value="FINAL">Final Exam</SelectItem>
                        <SelectItem value="PROJECT">Project</SelectItem>
                        <SelectItem value="PRESENTATION">Presentation</SelectItem>
                        <SelectItem value="LAB">Lab Work</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-base">
                      Subject <span className="text-red-500">*</span>
                    </Label>
                    <Select value={subjectId} onValueChange={setSubjectId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.code}: {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="maxMarks" className="text-base">
                      Maximum Marks <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="maxMarks"
                      type="number"
                      min="1"
                      step="0.1"
                      value={maxMarks}
                      onChange={(e) => setMaxMarks(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weightage" className="text-base flex items-center gap-2">
                      Weightage (%)
                      <Popover>
                        <PopoverTrigger asChild>
                          <Info className="h-4 w-4 text-gray-400 cursor-pointer" />
                        </PopoverTrigger>
                        <PopoverContent className="w-72">
                          <p className="text-sm text-gray-600">
                            Weightage determines how much this assessment contributes to the final grade. Leave at 0 if not applicable.
                          </p>
                        </PopoverContent>
                      </Popover>
                    </Label>
                    <Input
                      id="weightage"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={weightage}
                      onChange={(e) => setWeightage(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate" className="text-base">
                    Due Date
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !dueDate && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {dueDate ? format(dueDate, "PPP") : <span>Select deadline</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <CalendarComponent
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions" className="text-base">
                    Instructions
                  </Label>
                  <Textarea
                    id="instructions"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Provide detailed instructions for students..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Attachment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Assessment Resources</CardTitle>
                <CardDescription>
                  Upload any materials students will need
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="assessmentFile"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                  />
                  <label
                    htmlFor="assessmentFile"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="p-3 bg-blue-50 rounded-full">
                      <Upload className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="font-medium">Upload assessment file</p>
                    <p className="text-sm text-gray-500">
                      PDF, Word, or Excel (Max 10MB)
                    </p>
                  </label>
                </div>

                {file && (
                  <div className="bg-blue-50 p-3 rounded-md flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileUp className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setFile(null)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="mt-8 flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <span className="animate-spin mr-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                  </span>
                  Creating...
                </>
              ) : (
                "Create Assessment"
              )}
            </Button>
          </div>
        </form>
      </div>
    </FacultyLayout>
  );
}
