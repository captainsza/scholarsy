"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Search
} from "lucide-react";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/components/ui/toastall";
import { Badge } from "@/components/ui/Badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";

interface Student {
  id: string;
  name: string;
  enrollmentId: string;
  profileImage?: string | null;
}

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  courseId: string;
  courseName: string;
}

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE";

interface StudentAttendance {
  studentId: string;
  name: string;
  enrollmentId: string;
  profileImage?: string | null;
  status: AttendanceStatus | null;
  attendanceId: string | null;
}

export default function TakeAttendancePage() {
  const { courseId, subjectId } = useParams() as { courseId: string, subjectId: string };
  const router = useRouter();
  const { user } = useAuth();
  const [date, setDate] = useState<Date>(new Date());
  const [subjectInfo, setSubjectInfo] = useState<SubjectInfo | null>(null);
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Fetch subject info
  useEffect(() => {
    const fetchSubjectInfo = async () => {
      try {
        const res = await fetch(`/api/faculty/courses/${courseId}/subjects/${subjectId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch subject information");
        }
        const data = await res.json();
        setSubjectInfo(data.subject);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err.message || "Failed to load subject information",
          variant: "destructive",
        });
      }
    };

    fetchSubjectInfo();
  }, [courseId, subjectId]);

  // Fetch students and attendance status for selected date
  useEffect(() => {
    const fetchAttendance = async () => {
      if (!courseId || !subjectId || !date) return;
      
      setLoading(true);
      setError("");
      setSuccess(false);
      
      try {
        const formattedDate = format(date, "yyyy-MM-dd");
        const res = await fetch(`/api/faculty/courses/${courseId}/subjects/${subjectId}/attendance?date=${formattedDate}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch attendance data");
        }
        
        const data = await res.json();
        
        // Transform data
        const studentsWithAttendance = data.students.map((student: any) => ({
          studentId: student.id,
          name: student.name,
          enrollmentId: student.enrollmentId,
          profileImage: student.profileImage,
          status: student.attendanceStatus,
          attendanceId: student.attendanceId,
        }));
        
        setStudents(studentsWithAttendance);
        setFilteredStudents(studentsWithAttendance);
      } catch (err: any) {
        setError(err.message || "Failed to load attendance data");
        toast({
          title: "Error",
          description: err.message || "Failed to load attendance data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [courseId, subjectId, date]);

  // Filter students based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
      return;
    }

    const lowerQuery = searchQuery.toLowerCase();
    const filtered = students.filter(
      (student) =>
        student.name.toLowerCase().includes(lowerQuery) ||
        student.enrollmentId.toLowerCase().includes(lowerQuery)
    );
    setFilteredStudents(filtered);
  }, [students, searchQuery]);

  // Handle attendance status change
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.studentId === studentId
          ? { ...student, status }
          : student
      )
    );
    
    setFilteredStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.studentId === studentId
          ? { ...student, status }
          : student
      )
    );
  };

  // Set all students to the same status
  const markAll = (status: AttendanceStatus) => {
    setStudents((prevStudents) =>
      prevStudents.map((student) => ({ ...student, status }))
    );
    
    setFilteredStudents((prevStudents) =>
      prevStudents.map((student) => ({ ...student, status }))
    );
  };

  // Save attendance data
  const saveAttendance = async () => {
    if (!courseId || !subjectId) return;
    
    setSubmitting(true);
    setError("");
    setSuccess(false);
    
    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      
      // Prepare attendance data
      const attendanceData = students.map((student) => ({
        studentId: student.studentId,
        status: student.status || "ABSENT", // Default to absent if not marked
        attendanceId: student.attendanceId,
      }));
      
      const res = await fetch(`/api/faculty/courses/${courseId}/subjects/${subjectId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formattedDate,
          attendance: attendanceData,
        }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save attendance");
      }
      
      setSuccess(true);
      toast({
        title: "Success",
        description: "Attendance saved successfully",
      });
    } catch (err: any) {
      setError(err.message || "Failed to save attendance");
      toast({
        title: "Error",
        description: err.message || "Failed to save attendance",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Stats for the current attendance
  const getStats = () => {
    const total = students.length;
    const present = students.filter((s) => s.status === "PRESENT").length;
    const absent = students.filter((s) => s.status === "ABSENT").length;
    const late = students.filter((s) => s.status === "LATE").length;
    const notMarked = students.filter((s) => s.status === null).length;
    
    return { total, present, absent, late, notMarked };
  };

  const stats = getStats();

  // Helper to get background for attendance status
  const getStatusBg = (status: AttendanceStatus | null) => {
    switch (status) {
      case "PRESENT":
        return "bg-green-50 hover:bg-green-100";
      case "ABSENT":
        return "bg-red-50 hover:bg-red-100";
      case "LATE":
        return "bg-amber-50 hover:bg-amber-100";
      default:
        return "hover:bg-gray-50";
    }
  };

  return (
    <FacultyLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with back button */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Take Attendance</h1>
              <p className="text-gray-500">
                {subjectInfo ? (
                  <>
                    {subjectInfo.code}: {subjectInfo.name} | {subjectInfo.courseName}
                  </>
                ) : "Loading..."}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(date) => date && setDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Main content */}
        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Student Attendance</CardTitle>
                <CardDescription>
                  {format(date, "EEEE, MMMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAll("PRESENT")}
                  className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 border-green-200"
                >
                  <CheckCircle2 className="mr-1 h-4 w-4" /> Mark All Present
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => markAll("ABSENT")}
                  className="bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800 border-red-200"
                >
                  <XCircle className="mr-1 h-4 w-4" /> Mark All Absent
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            {/* Success message */}
            {success && (
              <div className="mb-6 bg-green-50 text-green-700 p-4 rounded-md flex items-center">
                <CheckCircle2 className="h-5 w-5 mr-2" />
                Attendance saved successfully!
              </div>
            )}
            
            {/* Error message */}
            {error && (
              <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-md flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                {error}
              </div>
            )}
            
            {/* Attendance stats */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-gray-50">
                  Total: {stats.total}
                </Badge>
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  Present: {stats.present}
                </Badge>
                <Badge variant="outline" className="bg-red-50 text-red-700">
                  Absent: {stats.absent}
                </Badge>
                <Badge variant="outline" className="bg-amber-50 text-amber-700">
                  Late: {stats.late}
                </Badge>
                {stats.notMarked > 0 && (
                  <Badge variant="outline" className="bg-gray-50 text-gray-500">
                    Not marked: {stats.notMarked}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Search box */}
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search by name or enrollment ID..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Attendance table */}
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-4" />
                <p className="text-indigo-600">Loading student data...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              searchQuery ? (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                  <p className="text-gray-500">Try adjusting your search query</p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No students enrolled</h3>
                  <p className="text-gray-500">There are no students enrolled in this course yet</p>
                </div>
              )
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Enrollment ID</TableHead>
                      <TableHead className="text-center">Mark Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => (
                      <TableRow key={student.studentId} className={getStatusBg(student.status)}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{student.name}</TableCell>
                        <TableCell>{student.enrollmentId}</TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-3">
                            <Button
                              size="sm"
                              variant={student.status === "PRESENT" ? "default" : "outline"}
                              onClick={() => handleStatusChange(student.studentId, "PRESENT")}
                              className={student.status === "PRESENT" ? "bg-green-600 hover:bg-green-700" : "text-green-700 border-green-200 hover:bg-green-50"}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-xs">Present</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={student.status === "ABSENT" ? "default" : "outline"}
                              onClick={() => handleStatusChange(student.studentId, "ABSENT")}
                              className={student.status === "ABSENT" ? "bg-red-600 hover:bg-red-700" : "text-red-700 border-red-200 hover:bg-red-50"}
                            >
                              <XCircle className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-xs">Absent</span>
                            </Button>
                            <Button
                              size="sm"
                              variant={student.status === "LATE" ? "default" : "outline"}
                              onClick={() => handleStatusChange(student.studentId, "LATE")}
                              className={student.status === "LATE" ? "bg-amber-600 hover:bg-amber-700" : "text-amber-700 border-amber-200 hover:bg-amber-50"}
                            >
                              <Clock className="h-4 w-4" />
                              <span className="sr-only sm:not-sr-only sm:ml-2 sm:text-xs">Late</span>
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
          
          <CardFooter className="flex justify-between bg-gray-50 p-6 border-t">
            <Button
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={saveAttendance}
              disabled={submitting || loading || students.length === 0}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Attendance
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </FacultyLayout>
  );
}
