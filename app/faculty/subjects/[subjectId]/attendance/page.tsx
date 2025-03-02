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
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calendar, 
  Users, 
  Clock,
  Check,
  X,
  BarChart3,
  Plus,
  Download,
  Filter
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AttendanceDashboardProps {
  params: {
    subjectId: string;
  }
}

export default function AttendanceDashboard({ params }: AttendanceDashboardProps) {
  const [subjectId, setSubjectId] = useState<string>("");
  const { user } = useAuth();
  const router = useRouter();
  const [subject, setSubject] = useState<any>(null);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("all");
  const [availableDates, setAvailableDates] = useState<string[]>([]);

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
        setAttendanceStats(data.attendanceStats);
        
        // Initialize students from the section enrollments
        const enrolledStudents = data.subject.section.enrollments
          .filter((enrollment: any) => enrollment.status === "ACTIVE")
          .map((enrollment: any) => enrollment.student);
        
        setStudents(enrolledStudents);

        // Extract unique dates from attendance records
        if (data.attendanceStats?.records) {
          const uniqueDates = [...new Set(
            data.attendanceStats.records.map((record: any) => 
              new Date(record.date).toLocaleDateString()
            )
          )] as string[];
          setAvailableDates(uniqueDates);
        }
        
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

  // Calculate attendance percentage for a student
  const calculateAttendancePercentage = (studentId: string) => {
    if (!attendanceStats?.records?.length) return 0;

    const studentAttendance = attendanceStats.records.filter(
      (record: any) => record.studentId === studentId
    );
    
    if (!studentAttendance.length) return 0;

    const presentCount = studentAttendance.filter(
      (record: any) => record.status === "PRESENT"
    ).length;

    return Math.round((presentCount / studentAttendance.length) * 100);
  };

  // Get filtered attendance records by date
  const getFilteredRecords = () => {
    if (!attendanceStats?.records) return [];

    if (selectedDate === "all") return attendanceStats.records;

    return attendanceStats.records.filter(
      (record: any) => new Date(record.date).toLocaleDateString() === selectedDate
    );
  };

  // Calculate aggregate attendance statistics
  const calculateAggregateStats = () => {
    if (!attendanceStats?.records?.length) {
      return { present: 0, absent: 0, late: 0 };
    }

    const stats = attendanceStats.records.reduce(
      (acc: any, record: any) => {
        if (record.status === "PRESENT") acc.present++;
        else if (record.status === "ABSENT") acc.absent++;
        else if (record.status === "LATE") acc.late++;
        return acc;
      },
      { present: 0, absent: 0, late: 0 }
    );

    const total = stats.present + stats.absent + stats.late;
    
    return {
      ...stats,
      presentPercentage: Math.round((stats.present / total) * 100) || 0,
      absentPercentage: Math.round((stats.absent / total) * 100) || 0,
      latePercentage: Math.round((stats.late / total) * 100) || 0
    };
  };

  const stats = calculateAggregateStats();
  const filteredRecords = getFilteredRecords();

  if (loading) {
    return (
      <FacultyLayout>
        <LoadingSpinner message="Loading attendance data..." />
      </FacultyLayout>
    );
  }

  if (error || !subject) {
    return (
      <FacultyLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error || "Subject not found"}</p>
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <div className="flex items-center">
              <button 
                onClick={() => router.back()}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Dashboard</h1>
              <Badge variant="outline" className="ml-2">
                {subject.code}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {subject.name} • {subject.section.name} • {subject.section.academicTerm}
            </p>
          </div>

          <div className="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <Button 
              variant="outline"
              onClick={() => router.push(`/faculty/subjects/${subjectId}/attendance/history`)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              View History
            </Button>
            <Button 
              onClick={() => router.push(`/faculty/subjects/${subjectId}/attendance/take`)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Take Attendance
            </Button>
          </div>
        </div>

        {/* Attendance Overview */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Overview</CardTitle>
              <CardDescription>Summary of attendance for all sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Summary statistics */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Overall Attendance</h3>
                    <div className="grid grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                      <div className="text-center">
                        <div className="text-green-600 text-2xl font-bold">{stats.presentPercentage}%</div>
                        <div className="text-xs text-gray-500 mt-1">Present</div>
                      </div>
                      <div className="text-center">
                        <div className="text-red-600 text-2xl font-bold">{stats.absentPercentage}%</div>
                        <div className="text-xs text-gray-500 mt-1">Absent</div>
                      </div>
                      <div className="text-center">
                        <div className="text-yellow-600 text-2xl font-bold">{stats.latePercentage}%</div>
                        <div className="text-xs text-gray-500 mt-1">Late</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Class Statistics</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-sm">
                        <span>Total Classes</span>
                        <Badge variant="outline">{attendanceStats?.totalClasses || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Total Records</span>
                        <Badge variant="outline">{attendanceStats?.totalRecords || 0}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Last Recorded</span>
                        <Badge variant="outline">
                          {attendanceStats?.records?.length > 0 
                            ? new Date(attendanceStats.records[0].date).toLocaleDateString() 
                            : "No records"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Attendance by status visualization */}
                <div className="md:col-span-2">
                  <h3 className="text-sm font-medium text-gray-500 mb-4">Attendance Distribution</h3>
                  <div className="bg-white p-4 rounded-lg border border-gray-200">
                    {/* Simple attendance visualization */}
                    <div className="flex h-6 overflow-hidden rounded-full bg-gray-200">
                      <div 
                        className="bg-green-500 transition-all duration-500"
                        style={{ width: `${stats.presentPercentage}%` }}
                      ></div>
                      <div 
                        className="bg-yellow-500 transition-all duration-500"
                        style={{ width: `${stats.latePercentage}%` }}
                      ></div>
                      <div 
                        className="bg-red-500 transition-all duration-500"
                        style={{ width: `${stats.absentPercentage}%` }}
                      ></div>
                    </div>
                    
                    {/* Legend */}
                    <div className="mt-4 flex justify-center space-x-6 text-xs">
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                        <span>Present ({stats.present})</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-yellow-500 mr-2"></div>
                        <span>Late ({stats.late})</span>
                      </div>
                      <div className="flex items-center">
                        <div className="h-3 w-3 rounded-full bg-red-500 mr-2"></div>
                        <span>Absent ({stats.absent})</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/faculty/subjects/${subjectId}/attendance/report`)}
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      View Detailed Reports
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records */}
        <Tabs defaultValue="by-session">
          <div className="flex justify-between items-center mb-4">
            <TabsList>
              <TabsTrigger value="by-session">By Session</TabsTrigger>
              <TabsTrigger value="by-student">By Student</TabsTrigger>
            </TabsList>
            
            <div className="w-48">
              <Select
                value={selectedDate}
                onValueChange={setSelectedDate}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Filter by date" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sessions</SelectItem>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>{date}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <TabsContent value="by-session">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records by Session</CardTitle>
                <CardDescription>
                  {selectedDate !== "all" 
                    ? `Showing records for ${selectedDate}` 
                    : "Showing all attendance records"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell>{new Date(record.date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <div className="flex items-center">
                                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium mr-2">
                                  {record.student.user.profile.firstName[0]}
                                  {record.student.user.profile.lastName[0]}
                                </div>
                                <span>
                                  {record.student.user.profile.firstName} {record.student.user.profile.lastName}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={
                                  record.status === "PRESENT" ? "success" : 
                                  record.status === "ABSENT" ? "destructive" : "warning"
                                }
                              >
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {record.remarks || <span className="text-gray-400 italic">No remarks</span>}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Clock className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedDate !== "all" 
                        ? `No records found for ${selectedDate}.` 
                        : "No attendance records have been taken yet."}
                    </p>
                    <Button 
                      onClick={() => router.push(`/faculty/subjects/${subjectId}/attendance/take`)}
                      className="mt-4"
                    >
                      Take Attendance
                    </Button>
                  </div>
                )}
              </CardContent>
              {filteredRecords.length > 0 && (
                <CardFooter className="flex justify-between border-t px-6 py-4">
                  <div className="text-sm text-gray-500">
                    Showing {filteredRecords.length} records
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
          
          <TabsContent value="by-student">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Records by Student</CardTitle>
                <CardDescription>
                  Student-wise attendance summary
                </CardDescription>
              </CardHeader>
              <CardContent>
                {students.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Present</TableHead>
                          <TableHead>Absent</TableHead>
                          <TableHead>Late</TableHead>
                          <TableHead>Attendance %</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {students.map((student) => {
                          // Calculate statistics for this student
                          const studentRecords = attendanceStats?.records?.filter(
                            (record: any) => record.studentId === student.id
                          ) || [];
                          
                          const present = studentRecords.filter(
                            (record: any) => record.status === "PRESENT"
                          ).length;
                          
                          const absent = studentRecords.filter(
                            (record: any) => record.status === "ABSENT"
                          ).length;
                          
                          const late = studentRecords.filter(
                            (record: any) => record.status === "LATE"
                          ).length;
                          
                          const percentage = calculateAttendancePercentage(student.id);
                          
                          return (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 text-sm font-medium mr-2">
                                    {student.user.profile.firstName[0]}
                                    {student.user.profile.lastName[0]}
                                  </div>
                                  <div>
                                    <div>
                                      {student.user.profile.firstName} {student.user.profile.lastName}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      ID: {student.enrollmentId}
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="success">{present}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="destructive">{absent}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="warning">{late}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                    <div 
                                      className={`h-2 rounded-full ${
                                        percentage >= 75 ? 'bg-green-500' : 
                                        percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${percentage}%` }}
                                    ></div>
                                  </div>
                                  <span>{percentage}%</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => router.push(`/faculty/students/${student.id}/attendance`)}
                                >
                                  View Details
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Users className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No students enrolled</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This section doesn't have any enrolled students yet.
                    </p>
                  </div>
                )}
              </CardContent>
              {students.length > 0 && (
                <CardFooter className="flex justify-between border-t px-6 py-4">
                  <div className="text-sm text-gray-500">
                    Showing {students.length} students
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Export to CSV
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}
