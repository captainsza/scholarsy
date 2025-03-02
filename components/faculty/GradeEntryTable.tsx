"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Check, Download, Save } from "lucide-react";
import { toast } from "@/components/ui/toastall";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface GradeEntryTableProps {
  assessmentId: string;
  subjectId: string;
}

export default function GradeEntryTable({ assessmentId, subjectId }: GradeEntryTableProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessment, setAssessment] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [marks, setMarks] = useState<Record<string, number | string>>({});
  const [feedback, setFeedback] = useState<Record<string, string>>({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [bulkSaveDialogOpen, setBulkSaveDialogOpen] = useState(false);

  // Fetch assessment details and enrolled students
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch assessment details
        const assessmentResponse = await fetch(`/api/faculty/assessments/${assessmentId}`);
        if (!assessmentResponse.ok) throw new Error("Failed to fetch assessment");
        const assessmentData = await assessmentResponse.json();

        // Fetch enrolled students for this section
        const studentsResponse = await fetch(`/api/faculty/subjects/${subjectId}/students`);
        if (!studentsResponse.ok) throw new Error("Failed to fetch students");
        const studentsData = await studentsResponse.json();

        setAssessment(assessmentData.assessment);
        setStudents(studentsData.students);

        // Initialize marks with existing grades
        const initialMarks: Record<string, number | string> = {};
        const initialFeedback: Record<string, string> = {};

        if (assessmentData.assessment?.marks) {
          assessmentData.assessment.marks.forEach((mark: any) => {
            initialMarks[mark.studentId] = mark.marksObtained;
            initialFeedback[mark.studentId] = mark.feedback || "";
          });
        }

        setMarks(initialMarks);
        setFeedback(initialFeedback);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load assessment data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (assessmentId && subjectId) {
      fetchData();
    }
  }, [assessmentId, subjectId]);

  // Handle mark input change
  const handleMarkChange = (studentId: string, value: string) => {
    const parsedValue = value === "" ? "" : parseFloat(value);
    
    // Validate max marks
    if (typeof parsedValue === "number" && !isNaN(parsedValue)) {
      if (parsedValue < 0) {
        return; // Don't allow negative marks
      }
      if (parsedValue > assessment.maxMarks) {
        toast({
          title: "Invalid marks",
          description: `Marks cannot exceed maximum (${assessment.maxMarks})`,
          variant: "destructive",
        });
        return;
      }
    }
    
    setMarks((prev) => ({ ...prev, [studentId]: parsedValue }));
    setUnsavedChanges(true);
  };

  // Handle feedback input change
  const handleFeedbackChange = (studentId: string, value: string) => {
    setFeedback((prev) => ({ ...prev, [studentId]: value }));
    setUnsavedChanges(true);
  };

  // Save an individual student's mark
  const saveStudentMark = async (studentId: string) => {
    if (marks[studentId] === undefined || marks[studentId] === "") {
      toast({
        title: "Error",
        description: "Please enter valid marks",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);
      
      const response = await fetch(`/api/faculty/grades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assessmentId,
          studentId,
          marksObtained: marks[studentId],
          feedback: feedback[studentId] || "",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save marks");
      }

      toast({
        title: "Marks Saved",
        description: "Student marks have been saved successfully",
      });
    } catch (error) {
      console.error("Error saving marks:", error);
      toast({
        title: "Error",
        description: "Failed to save marks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Bulk save all student marks
  const saveAllMarks = async () => {
    try {
      setSaving(true);
      setBulkSaveDialogOpen(false);
      
      const marksToSave = students
        .filter((student) => marks[student.id] !== undefined && marks[student.id] !== "")
        .map((student) => ({
          assessmentId,
          studentId: student.id,
          marksObtained: marks[student.id],
          feedback: feedback[student.id] || "",
        }));

      const response = await fetch(`/api/faculty/grades/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ marks: marksToSave }),
      });

      if (!response.ok) {
        throw new Error("Failed to save marks");
      }

      setUnsavedChanges(false);
      
      toast({
        title: "All Marks Saved",
        description: `Successfully saved marks for ${marksToSave.length} students`,
        variant: "success",
      });
    } catch (error) {
      console.error("Error saving marks:", error);
      toast({
        title: "Error",
        description: "Failed to save marks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Export grades to CSV
  const exportGrades = () => {
    // Get all students with their marks
    const data = students.map((student) => {
      return {
        "Student ID": student.enrollmentId,
        "Name": `${student.user.profile.firstName} ${student.user.profile.lastName}`,
        "Marks": marks[student.id] || "",
        "Out of": assessment.maxMarks,
        "Feedback": feedback[student.id] || ""
      };
    });

    // Convert to CSV
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(obj => Object.values(obj).map(value => 
      typeof value === 'string' && value.includes(',') 
        ? `"${value}"`
        : value
    ).join(","));
    
    const csv = [headers, ...rows].join("\n");
    
    // Create download link
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${assessment.title}_grades.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <LoadingSpinner message="Loading student data..." />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium">
            {assessment?.title} 
            <span className="ml-2 text-sm font-normal text-gray-500">
              (Max marks: {assessment?.maxMarks})
            </span>
          </h3>
          <p className="text-sm text-gray-500">Enter marks for each student</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportGrades}
            disabled={saving || students.length === 0}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <AlertDialog open={bulkSaveDialogOpen} onOpenChange={setBulkSaveDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                size="sm"
                disabled={saving || !unsavedChanges}
              >
                <Save className="h-4 w-4 mr-2" />
                Save All
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Save all marks?</AlertDialogTitle>
              </AlertDialogHeader>
              <p>
                This will save marks for all students with entered values. Are you sure you want to continue?
              </p>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={saveAllMarks}>Save</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enrollment ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-32">Marks</TableHead>
              <TableHead>Feedback</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  No students found in this subject
                </TableCell>
              </TableRow>
            ) : (
              students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.enrollmentId}</TableCell>
                  <TableCell>
                    {student.user.profile.firstName} {student.user.profile.lastName}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      placeholder={`/${assessment?.maxMarks}`}
                      className="max-w-[80px]"
                      value={marks[student.id] === undefined ? "" : marks[student.id]}
                      onChange={(e) => handleMarkChange(student.id, e.target.value)}
                      min={0}
                      max={assessment?.maxMarks}
                      step="0.5"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Brief feedback"
                      value={feedback[student.id] || ""}
                      onChange={(e) => handleFeedbackChange(student.id, e.target.value)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => saveStudentMark(student.id)}
                      disabled={saving || marks[student.id] === undefined || marks[student.id] === ""}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Save
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {unsavedChanges && (
        <div className="mt-4 bg-yellow-50 p-2 rounded-md text-center text-sm text-yellow-800 flex items-center justify-center">
          <span>You have unsaved changes.</span>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-yellow-800 hover:text-yellow-900 ml-2"
            onClick={() => setBulkSaveDialogOpen(true)}
            disabled={saving}
          >
            Save All
          </Button>
        </div>
      )}
    </div>
  );
}