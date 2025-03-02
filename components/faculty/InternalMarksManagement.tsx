"use client";

import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/Badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Slider } from "@/components/ui/slider";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Save, Download, BarChart3, Calculator } from "lucide-react";
import { toast } from "@/components/ui/toastall";

interface InternalMarksManagementProps {
  facultyId: string;
}

export default function InternalMarksManagement({ facultyId }: InternalMarksManagementProps) {
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [semester, setSemester] = useState<string>("");
  const [students, setStudents] = useState<any[]>([]);
  const [internalMarks, setInternalMarks] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [bulkSaveDialogOpen, setBulkSaveDialogOpen] = useState(false);
  const [attendanceWeight, setAttendanceWeight] = useState(30); // Default weight for attendance (out of 100%)
  const [activeTab, setActiveTab] = useState("marks");

  // Configuration
  const maxSessionalMarks = 70; // Maximum marks for sessionals
  const maxAttendanceMarks = 30; // Maximum marks for attendance
  const maxTotalMarks = 100; // Maximum total internal marks
  
  const semesters = [
    "Winter 2023",
    "Summer 2023",
    "Fall 2023", 
    "Winter 2024",
    "Summer 2024"
  ];

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
        toast({
          title: "Error",
          description: "Failed to load subjects",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    if (facultyId) {
      fetchSubjects();
    }
  }, [facultyId]);

  // Fetch students when subject is selected and semester is chosen
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedSubject || !semester) {
        setStudents([]);
        setInternalMarks({});
        return;
      }

      try {
        setLoading(true);
        
        // Fetch subject first to get course ID
        const subjectResponse = await fetch(`/api/faculty/internal-marks/subjects/${selectedSubject}`);
        if (!subjectResponse.ok) throw new Error("Failed to fetch subject");
        const subjectData = await subjectResponse.json();
        
        const courseId = subjectData.subject.section.courseId;
        
        // Fetch students enrolled in this subject
        const studentsResponse = await fetch(`/api/faculty/internal-marks/subjects/${selectedSubject}/students`);
        if (!studentsResponse.ok) throw new Error("Failed to fetch students");
        const studentsData = await studentsResponse.json();
        
        // Fetch existing internal marks for this course and semester
        const marksResponse = await fetch(`/api/faculty/internal-marks?courseId=${courseId}&semester=${encodeURIComponent(semester)}`);
        if (!marksResponse.ok) throw new Error("Failed to fetch internal marks");
        const marksData = await marksResponse.json();
        
        // Get student attendance for calculation
        const attendanceResponse = await fetch(`/api/faculty/internal-marks/subjects/${selectedSubject}/attendance`);
        if (!attendanceResponse.ok) throw new Error("Failed to fetch attendance");
        const attendanceData = await attendanceResponse.json();
        
        // Process and set students
        setStudents(studentsData.students || []);
        
        // Initialize marks data structure
        const marksObject: Record<string, any> = {};
        studentsData.students.forEach((student: any) => {
          // Find existing marks record for this student
          const existingMarks = marksData.internalMarks.find(
            (mark: any) => mark.studentId === student.id
          );
          
          // Find attendance data for this student
          const attendanceRecord = attendanceData.attendance.find(
            (att: any) => att.studentId === student.id
          ) || { attendancePercentage: 0 };
          
          // Calculate attendance marks based on percentage (up to maxAttendanceMarks)
          const calculatedAttendanceMarks = Math.min(
            (attendanceRecord.attendancePercentage / 100) * maxAttendanceMarks,
            maxAttendanceMarks
          );
          
          marksObject[student.id] = {
            // Use existing data if available, otherwise initialize
            sessionalMark: existingMarks?.sessionalMark || 0,
            attendanceMark: existingMarks?.attendanceMark || calculatedAttendanceMarks,
            totalMark: existingMarks?.totalMark || calculatedAttendanceMarks,
            attendancePercentage: attendanceRecord.attendancePercentage || 0,
            // Existing record ID is needed for updates
            recordId: existingMarks?.id || null,
            // Tracking changes
            changed: false
          };
        });
        
        setInternalMarks(marksObject);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load data",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedSubject, semester]);

  // Handle mark input change
  const handleSessionalMarkChange = (studentId: string, value: string) => {
    const parsedValue = value === "" ? 0 : parseFloat(value);
    
    // Validate marks
    if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > maxSessionalMarks) {
      toast({
        title: "Invalid marks",
        description: `Sessional marks must be between 0 and ${maxSessionalMarks}`,
        variant: "destructive"
      });
      return;
    }
    
    setInternalMarks(prev => {
      const studentMarks = { ...prev[studentId] };
      studentMarks.sessionalMark = parsedValue;
      studentMarks.totalMark = parsedValue + studentMarks.attendanceMark;
      studentMarks.changed = true;
      
      return { ...prev, [studentId]: studentMarks };
    });
    
    setUnsavedChanges(true);
  };

  // Handle attendance mark input change
  const handleAttendanceMarkChange = (studentId: string, value: string) => {
    const parsedValue = value === "" ? 0 : parseFloat(value);
    
    // Validate marks
    if (isNaN(parsedValue) || parsedValue < 0 || parsedValue > maxAttendanceMarks) {
      toast({
        title: "Invalid marks",
        description: `Attendance marks must be between 0 and ${maxAttendanceMarks}`,
        variant: "destructive"
      });
      return;
    }
    
    setInternalMarks(prev => {
      const studentMarks = { ...prev[studentId] };
      studentMarks.attendanceMark = parsedValue;
      studentMarks.totalMark = studentMarks.sessionalMark + parsedValue;
      studentMarks.changed = true;
      
      return { ...prev, [studentId]: studentMarks };
    });
    
    setUnsavedChanges(true);
  };

  // Calculate attendance marks automatically based on attendance percentage
  const calculateAttendanceMarks = () => {
    setInternalMarks(prev => {
      const updated = { ...prev };
      
      Object.keys(updated).forEach(studentId => {
        const studentMarks = { ...updated[studentId] };
        // Calculate attendance marks based on percentage
        const calculatedAttendanceMarks = Math.min(
          (studentMarks.attendancePercentage / 100) * maxAttendanceMarks,
          maxAttendanceMarks
        ).toFixed(1);
        
        studentMarks.attendanceMark = parseFloat(calculatedAttendanceMarks);
        studentMarks.totalMark = studentMarks.sessionalMark + parseFloat(calculatedAttendanceMarks);
        studentMarks.changed = true;
        
        updated[studentId] = studentMarks;
      });
      
      return updated;
    });
    
    setUnsavedChanges(true);
    toast({
      title: "Attendance Marks Calculated",
      description: "Attendance marks have been automatically calculated based on attendance percentage."
    });
  };

  // Bulk save all internal marks
  const saveAllMarks = async () => {
    try {
      setSaving(true);
      setBulkSaveDialogOpen(false);
      
      // Get the course ID for the selected subject
      const subjectResponse = await fetch(`/api/faculty/internal-marks/subjects/${selectedSubject}`);
      if (!subjectResponse.ok) throw new Error("Failed to fetch subject");
      const subjectData = await subjectResponse.json();
      const courseId = subjectData.subject.section.courseId;
      
      const marksToSave = Object.keys(internalMarks)
        .filter(studentId => internalMarks[studentId].changed)
        .map(studentId => ({
          id: internalMarks[studentId].recordId,
          studentId,
          facultyId,
          courseId, // Use courseId instead of subjectId
          sessionalMark: internalMarks[studentId].sessionalMark,
          attendanceMark: internalMarks[studentId].attendanceMark,
          totalMark: internalMarks[studentId].totalMark,
          semester
        }));
      
      if (marksToSave.length === 0) {
        toast({
          title: "No Changes",
          description: "No marks have been changed to save.",
        });
        setSaving(false);
        return;
      }
      
      const response = await fetch("/api/faculty/internal-marks/bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ marks: marksToSave }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to save internal marks");
      }
      
      const result = await response.json();
      
      // Update record IDs for newly created records
      if (result.records) {
        setInternalMarks(prev => {
          const updated = { ...prev };
          
          result.records.forEach((record: any) => {
            if (updated[record.studentId]) {
              updated[record.studentId] = {
                ...updated[record.studentId],
                recordId: record.id,
                changed: false
              };
            }
          });
          
          return updated;
        });
      }
      
      setUnsavedChanges(false);
      
      toast({
        title: "Marks Saved",
        description: `Successfully saved internal marks for ${marksToSave.length} students.`,
        variant: "success"
      });
    } catch (error) {
      console.error("Error saving marks:", error);
      toast({
        title: "Error",
        description: "Failed to save marks. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  // Export internal marks to CSV
  const exportMarks = () => {
    // Get all students with their marks
    const data = students.map(student => {
      const marks = internalMarks[student.id] || { sessionalMark: 0, attendanceMark: 0, totalMark: 0 };
      
      return {
        "Enrollment ID": student.enrollmentId,
        "Name": `${student.user.profile.firstName} ${student.user.profile.lastName}`,
        "Sessional Marks": marks.sessionalMark,
        "Attendance Marks": marks.attendanceMark,
        "Total Internal Marks": marks.totalMark,
        "Attendance %": marks.attendancePercentage + "%",
        "Semester": semester
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
    link.setAttribute("download", `Internal_Marks_${subjects.find(s => s.id === selectedSubject)?.name || 'Subject'}_${semester}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format grade based on total mark
  const getGrade = (totalMark: number) => {
    if (totalMark >= 90) return "A+";
    if (totalMark >= 80) return "A";
    if (totalMark >= 70) return "B+";
    if (totalMark >= 60) return "B";
    if (totalMark >= 50) return "C";
    if (totalMark >= 40) return "D";
    return "F";
  };

  // Format subject name to include section
  const formatSubjectName = (subject: any) => {
    return `${subject.code}: ${subject.name} (${subject.section?.name || 'No Section'})`;
  };

  if (loading && !selectedSubject) {
    return <LoadingSpinner message="Loading subjects..." />;
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Internal Marks Management</h1>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={calculateAttendanceMarks}
            disabled={!selectedSubject || !semester || students.length === 0}
          >
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Attendance Marks
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Selection Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Select Subject and Semester</CardTitle>
            <CardDescription>
              Choose a subject and semester to manage internal marks
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <Select
                  value={selectedSubject}
                  onValueChange={(value) => {
                    if (unsavedChanges) {
                      if (confirm("You have unsaved changes. Are you sure you want to change subjects?")) {
                        setSelectedSubject(value);
                      }
                    } else {
                      setSelectedSubject(value);
                    }
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
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Semester
                </label>
                <Select
                  value={semester}
                  onValueChange={(value) => {
                    if (unsavedChanges) {
                      if (confirm("You have unsaved changes. Are you sure you want to change semester?")) {
                        setSemester(value);
                      }
                    } else {
                      setSemester(value);
                    }
                  }}
                  disabled={!selectedSubject}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    {semesters.map((sem) => (
                      <SelectItem key={sem} value={sem}>
                        {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Marks Table */}
        {selectedSubject && semester && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div>
                <CardTitle>{subjects.find(s => s.id === selectedSubject)?.name}</CardTitle>
                <CardDescription>
                  Internal marks for {semester} | Section: {subjects.find(s => s.id === selectedSubject)?.section?.name || 'N/A'}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportMarks}
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
                      This will save internal marks for all students with changes. Are you sure you want to continue?
                    </p>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={saveAllMarks}>Save</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                defaultValue="marks"
                value={activeTab}
                onValueChange={setActiveTab}
              >
                <TabsList className="mb-4">
                  <TabsTrigger value="marks">Marks Entry</TabsTrigger>
                  <TabsTrigger value="statistics">Statistics</TabsTrigger>
                </TabsList>

                <TabsContent value="marks">
                  {loading ? (
                    <LoadingSpinner message="Loading student data..." />
                  ) : students.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No students found for this subject in the selected semester.</p>
                    </div>
                  ) : (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Enrollment ID</TableHead>
                            <TableHead>Student Name</TableHead>
                            <TableHead className="w-32">
                              Sessional Marks
                              <span className="text-xs text-gray-500 block">
                                (Max: {maxSessionalMarks})
                              </span>
                            </TableHead>
                            <TableHead className="w-32">
                              Attendance Marks
                              <span className="text-xs text-gray-500 block">
                                (Max: {maxAttendanceMarks})
                              </span>
                            </TableHead>
                            <TableHead className="w-32">
                              Total
                              <span className="text-xs text-gray-500 block">
                                (Max: {maxTotalMarks})
                              </span>
                            </TableHead>
                            <TableHead>Grade</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => {
                            const marks = internalMarks[student.id] || { 
                              sessionalMark: 0, 
                              attendanceMark: 0, 
                              totalMark: 0,
                              attendancePercentage: 0
                            };
                            
                            return (
                              <TableRow key={student.id} 
                                className={marks.changed ? "bg-blue-50" : ""}>
                                <TableCell className="font-medium">{student.enrollmentId}</TableCell>
                                <TableCell>
                                  {student.user.profile.firstName} {student.user.profile.lastName}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    className="max-w-[80px]"
                                    value={marks.sessionalMark}
                                    onChange={(e) => handleSessionalMarkChange(student.id, e.target.value)}
                                    min={0}
                                    max={maxSessionalMarks}
                                    step="0.5"
                                  />
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="number"
                                      className="max-w-[80px]"
                                      value={marks.attendanceMark}
                                      onChange={(e) => handleAttendanceMarkChange(student.id, e.target.value)}
                                      min={0}
                                      max={maxAttendanceMarks}
                                      step="0.5"
                                    />
                                    <span className="text-xs text-gray-500">
                                      {marks.attendancePercentage}%
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="font-medium">
                                    {marks.totalMark.toFixed(1)}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={
                                      marks.totalMark >= 60 ? "success" :
                                      marks.totalMark >= 40 ? "default" :
                                      "destructive"
                                    }
                                  >
                                    {getGrade(marks.totalMark)}
                                  </Badge>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {unsavedChanges && !loading && (
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
                </TabsContent>

                <TabsContent value="statistics">
                  {loading ? (
                    <LoadingSpinner message="Loading statistics..." />
                  ) : students.length === 0 ? (
                    <div className="text-center py-6 bg-gray-50 rounded-md">
                      <p className="text-gray-500">No data available for statistics.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Class Overview</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* Calculate statistics */}
                            {(() => {
                              const totalMarks = Object.values(internalMarks).map(m => m.totalMark);
                              const avgMark = totalMarks.reduce((sum, mark) => sum + mark, 0) / totalMarks.length;
                              const maxMark = Math.max(...totalMarks);
                              const minMark = Math.min(...totalMarks);
                              
                              const gradeDistribution = {
                                "A+": 0, "A": 0, "B+": 0, "B": 0, "C": 0, "D": 0, "F": 0
                              };
                              
                              Object.values(internalMarks).forEach(mark => {
                                gradeDistribution[getGrade(mark.totalMark)]++;
                              });
                              
                              return (
                                <div className="space-y-6">
                                  <div className="grid grid-cols-3 gap-4 text-center">
                                    <div className="bg-green-50 p-4 rounded-md">
                                      <div className="text-lg font-bold text-green-700">{avgMark.toFixed(1)}</div>
                                      <div className="text-xs text-green-600">Class Average</div>
                                    </div>
                                    <div className="bg-blue-50 p-4 rounded-md">
                                      <div className="text-lg font-bold text-blue-700">{maxMark}</div>
                                      <div className="text-xs text-blue-600">Highest Mark</div>
                                    </div>
                                    <div className="bg-amber-50 p-4 rounded-md">
                                      <div className="text-lg font-bold text-amber-700">{minMark}</div>
                                      <div className="text-xs text-amber-600">Lowest Mark</div>
                                    </div>
                                  </div>
                                  
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">Grade Distribution</h4>
                                    <div className="space-y-2">
                                      {Object.entries(gradeDistribution).map(([grade, count]) => (
                                        <div key={grade} className="flex items-center">
                                          <div className="w-8 text-sm font-medium">{grade}</div>
                                          <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                              className={`h-full ${
                                                grade === "A+" || grade === "A" ? "bg-green-500" :
                                                grade === "B+" || grade === "B" ? "bg-blue-500" :
                                                grade === "C" || grade === "D" ? "bg-amber-500" :
                                                "bg-red-500"
                                              }`}
                                              style={{ width: `${(count / students.length) * 100}%` }}
                                            ></div>
                                          </div>
                                          <div className="w-8 text-right text-sm">{count}</div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader>
                          <CardTitle>Attendance Impact</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Attendance Weight in Total Marks
                              </label>
                              <div className="flex items-center">
                                <Slider
                                  defaultValue={[attendanceWeight]}
                                  max={50}
                                  step={1}
                                  className="flex-1 mr-4"
                                  onValueChange={(values) => {
                                    setAttendanceWeight(values[0]);
                                  }}
                                />
                                <span className="text-sm font-medium">
                                  {attendanceWeight}%
                                </span>
                              </div>
                            </div>
                            
                            <div className="pt-4">
                              <h4 className="text-sm font-medium mb-2">Attendance vs. Performance</h4>
                              <div className="h-60 border rounded-md p-4 flex items-center justify-center">
                                <div className="text-center text-gray-500">
                                  <BarChart3 className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                                  <p>Attendance correlation chart visualization would appear here.</p>
                                  <p className="text-xs">This is a placeholder for a visualization showing the correlation between attendance and performance.</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
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