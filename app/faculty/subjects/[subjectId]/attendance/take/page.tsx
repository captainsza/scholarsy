"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Check, X, Clock, AlertCircle, Users } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TakeAttendancePageProps {
  params: {
    subjectId: string;
  }
}

export default function TakeAttendancePage({ params }: TakeAttendancePageProps) {
  const [subjectId, setSubjectId] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<Record<string, { status: string; remarks: string }>>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  // Set params after component mounts
  useEffect(() => {
    if (params.subjectId) {
      setSubjectId(params.subjectId);
    }
  }, [params]);

  useEffect(() => {
    const fetchSubjectDetails = async () => {
      try {
        if (!subjectId || !user?.faculty?.id) return;

        setLoading(true);
        const response = await fetch(
          `/api/faculty/subjects/${subjectId}?facultyId=${user.faculty.id}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch subject details");
        }

        const data = await response.json();
        setSubject(data.subject);
        
        // Initialize students from the section enrollments
        const enrolledStudents = data.subject.section.enrollments
          .filter((enrollment: any) => enrollment.status === "ACTIVE")
          .map((enrollment: any) => enrollment.student);
        
        setStudents(enrolledStudents);
        
        // Initialize attendance records for all students with "PRESENT" status
        const initialRecords: Record<string, { status: string; remarks: string }> = {};
        enrolledStudents.forEach((student: any) => {
          initialRecords[student.id] = { status: "PRESENT", remarks: "" };
        });
        setAttendanceRecords(initialRecords);
      } catch (err) {
        console.error("Error fetching subject details:", err);
        setError("Failed to load subject details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (subjectId && user) {
      fetchSubjectDetails();
    }
  }, [subjectId, user]);

  const updateAttendanceStatus = (studentId: string, status: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const updateAttendanceRemarks = (studentId: string, remarks: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks }
    }));
  };

  const handleSubmit = async () => {
    try {
      if (!subjectId || !subject?.section?.id) {
        setError("Missing required subject information");
        return;
      }

      setSubmitting(true);
      setError("");
      
      // Format attendance records for API submission
      const formattedRecords = Object.entries(attendanceRecords).map(([studentId, record]) => ({
        studentId,
        status: record.status,
        remarks: record.remarks
      }));

      const response = await fetch(
        `/api/faculty/courses/${subject.section.courseId}/sections/${subject.section.id}`, 
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            subjectId,
            attendanceRecords: formattedRecords,
            facultyId: user?.faculty?.id
          })
        }
      );

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to submit attendance");
      }

      setSuccess("Attendance recorded successfully");
      
      // Navigate back to subject page after short delay
      setTimeout(() => {
        router.push(`/faculty/subjects/${subjectId}`);
      }, 2000);
      
    } catch (err: any) {
      console.error("Error submitting attendance:", err);
      setError(err.message || "Failed to submit attendance");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FacultyLayout>
        <LoadingSpinner message="Loading subject information..." />
      </FacultyLayout>
    );
  }

  if (error && !subject) {
    return (
      <FacultyLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
            <Button 
              onClick={() => router.back()}
              className="mt-4"
              variant="outline"
            >
              Go Back
            </Button>
          </div>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center mb-6">
          <button 
            onClick={() => router.back()}
            className="mr-2 text-gray-500 hover:text-gray-700"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Take Attendance</h1>
            <p className="mt-1 text-sm text-gray-500">
              {subject?.name} ({subject?.code}) - {subject?.section?.name}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <Card>
            <CardHeader className="bg-blue-50">
              <CardTitle>Mark Attendance for Today</CardTitle>
              <p className="text-blue-700 text-sm mt-1">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </CardHeader>
            <CardContent className="pt-6">
              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded mb-6">
                  <p className="flex items-center">
                    <Check className="h-5 w-5 mr-2" />
                    {success}
                  </p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded mb-6">
                  <p className="flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {error}
                  </p>
                </div>
              )}
              
              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Student Name</TableHead>
                        <TableHead className="w-[200px]">Status</TableHead>
                        <TableHead>Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">{student.enrollmentId}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium mr-2">
                                {student.user.profile.firstName[0]}
                                {student.user.profile.lastName[0]}
                              </div>
                              <span>
                                {student.user.profile.firstName} {student.user.profile.lastName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => updateAttendanceStatus(student.id, 'PRESENT')}
                                className={`flex items-center px-3 py-1 rounded-md ${
                                  attendanceRecords[student.id]?.status === 'PRESENT'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-gray-50 text-gray-800'
                                }`}
                              >
                                <Check className="h-4 w-4 mr-1" />
                                Present
                              </button>
                              <button
                                onClick={() => updateAttendanceStatus(student.id, 'ABSENT')}
                                className={`flex items-center px-3 py-1 rounded-md ${
                                  attendanceRecords[student.id]?.status === 'ABSENT'
                                    ? 'bg-red-100 text-red-800'
                                    : 'bg-gray-50 text-gray-800'
                                }`}
                              >
                                <X className="h-4 w-4 mr-1" />
                                Absent
                              </button>
                              <button
                                onClick={() => updateAttendanceStatus(student.id, 'LATE')}
                                className={`flex items-center px-3 py-1 rounded-md ${
                                  attendanceRecords[student.id]?.status === 'LATE'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : 'bg-gray-50 text-gray-800'
                                }`}
                              >
                                <Clock className="h-4 w-4 mr-1" />
                                Late
                              </button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <input
                              type="text"
                              placeholder="Add remarks (optional)"
                              className="w-full p-2 border rounded-md text-sm"
                              value={attendanceRecords[student.id]?.remarks || ''}
                              onChange={(e) => updateAttendanceRemarks(student.id, e.target.value)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-6">
                  <Users className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This section doesn't have any enrolled students yet.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-gray-50 flex justify-between">
              <Button variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button 
                disabled={submitting || students.length === 0} 
                onClick={handleSubmit}
              >
                {submitting ? 'Submitting...' : 'Submit Attendance'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </FacultyLayout>
  );
}