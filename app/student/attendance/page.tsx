"use client";

import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
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
import { 
  Calendar, 
  BookOpen, 
  Check,
  X,
  Clock,
  AlertTriangle,
  BarChart
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export default function StudentAttendancePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [attendanceData, setAttendanceData] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!user?.student?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/student/attendance?studentId=${user.student.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch attendance data");
        }
        
        const data = await response.json();
        setAttendanceData(data);
      } catch (err: any) {
        console.error("Error fetching attendance:", err);
        setError(err.message || "Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchAttendanceData();
    }
  }, [user]);

  // Calculate overall attendance percentage
  const calculateOverallAttendance = () => {
    if (!attendanceData?.subjects?.length) return { present: 0, absent: 0, late: 0, total: 0, percentage: 0 };
    
    let totalClasses = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    
    attendanceData.subjects.forEach((subject: any) => {
      totalClasses += subject.attendanceRecords.length;
      presentCount += subject.stats.presentCount;
      absentCount += subject.stats.absentCount;
      lateCount += subject.stats.lateCount;
    });
    
    const percentage = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
    
    return {
      present: presentCount,
      absent: absentCount,
      late: lateCount,
      total: totalClasses,
      percentage
    };
  };

  // Get attendance records for the selected subject
  const getFilteredAttendanceRecords = () => {
    if (!attendanceData?.subjects) return [];
    
    if (selectedSubject === "all") {
      // Combine all records from all subjects
      return attendanceData.subjects.flatMap((subject: any) => 
        subject.attendanceRecords.map((record: any) => ({
          ...record,
          subjectName: subject.name,
          subjectCode: subject.code
        }))
      ).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else {
      // Get records for selected subject only
      const subject = attendanceData.subjects.find((s: any) => s.id === selectedSubject);
      if (!subject) return [];
      
      return subject.attendanceRecords
        .map((record: any) => ({
          ...record,
          subjectName: subject.name,
          subjectCode: subject.code
        }))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  };

  const overallStats = calculateOverallAttendance();
  const filteredRecords = getFilteredAttendanceRecords();
  const hasTodayAttendance = attendanceData?.todayAttendance && attendanceData.todayAttendance.length > 0;

  if (loading) {
    return (
      <StudentLayout>
        <LoadingSpinner message="Loading your attendance data..." />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
          <p className="mt-1 text-sm text-gray-500">
            Track your attendance across all enrolled courses
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Today's Attendance Section */}
        {hasTodayAttendance && (
          <Card className="mb-8 border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-xl">
                <Calendar className="mr-2 h-5 w-5 text-blue-500" />
                Today's Attendance
              </CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString(undefined, { 
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attendanceData.todayAttendance.map((record: any) => (
                  <div key={record.id} className="flex justify-between items-center p-3 rounded-md bg-gray-50">
                    <div>
                      <p className="font-medium">{record.subjectCode}: {record.subjectName}</p>
                      {record.remarks && (
                        <p className="text-xs text-gray-500 mt-1">{record.remarks}</p>
                      )}
                    </div>
                    <Badge 
                      variant={
                        record.status === "PRESENT" ? "success" : 
                        record.status === "ABSENT" ? "destructive" : "warning"
                      }
                      className="ml-2"
                    >
                      {record.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Monthly Statistics Card */}
        {attendanceData?.monthlyStats && (
          <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-xl">
                <Calendar className="mr-2 h-5 w-5 text-indigo-500" />
                {attendanceData.monthlyStats.month} Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white border-4 border-indigo-500 mr-4">
                    <span className="text-xl font-bold text-indigo-600">{attendanceData.monthlyStats.percentage}%</span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Overall</p>
                    <p className="font-medium">{attendanceData.monthlyStats.total} Classes</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 md:gap-8">
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mr-3">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Present</p>
                      <p className="font-medium">{attendanceData.monthlyStats.present}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mr-3">
                      <X className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Absent</p>
                      <p className="font-medium">{attendanceData.monthlyStats.absent}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
                      <Clock className="h-5 w-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Late</p>
                      <p className="font-medium">{attendanceData.monthlyStats.late}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendance Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card className="bg-blue-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Overall Attendance</p>
                  <p className="mt-1 text-3xl font-bold text-blue-700">{overallStats.percentage}%</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-3 text-sm text-blue-600">
                {overallStats.percentage >= 75 ? (
                  <span className="flex items-center">
                    <Check className="h-4 w-4 mr-1" />
                    Good attendance
                  </span>
                ) : (
                  <span className="flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    Needs improvement
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Present</p>
                  <p className="mt-1 text-3xl font-bold text-green-700">{overallStats.present}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-3 text-sm text-green-600">
                {overallStats.total > 0 && 
                  `${Math.round((overallStats.present / overallStats.total) * 100)}% of classes`}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-red-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Absent</p>
                  <p className="mt-1 text-3xl font-bold text-red-700">{overallStats.absent}</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <X className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div className="mt-3 text-sm text-red-600">
                {overallStats.total > 0 && 
                  `${Math.round((overallStats.absent / overallStats.total) * 100)}% of classes`}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Late</p>
                  <p className="mt-1 text-3xl font-bold text-yellow-700">{overallStats.late}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
              <div className="mt-3 text-sm text-yellow-600">
                {overallStats.total > 0 && 
                  `${Math.round((overallStats.late / overallStats.total) * 100)}% of classes`}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="records" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="records">Subject-wise</TabsTrigger>
            <TabsTrigger value="subjects">Attendance by Subject</TabsTrigger>
          </TabsList>

          <TabsContent value="records">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Attendance History</h2>
              
              {/* Subject filter dropdown */}
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Filter by subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {attendanceData?.subjects?.map((subject: any) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.code} - {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Attendance Details</CardTitle>
                <CardDescription>
                  {selectedSubject === "all" ? 
                    "Showing records from all subjects" : 
                    `Showing records for ${attendanceData?.subjects?.find((s: any) => s.id === selectedSubject)?.name || ""}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredRecords.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Remarks</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRecords.map((record: any) => (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div className="flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                                {new Date(record.date).toLocaleDateString()}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <span className="font-medium">{record.subjectCode}</span>
                                <p className="text-xs text-gray-500">{record.subjectName}</p>
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
                  <div className="py-10 text-center">
                    <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No attendance records found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedSubject !== "all" ? 
                        "No attendance records for the selected subject." : 
                        "You don't have any attendance records yet."}
                    </p>
                  </div>
                )}
              </CardContent>
              {filteredRecords.length > 0 && (
                <CardFooter className="bg-gray-50 text-sm text-gray-500">
                  Showing {filteredRecords.length} records
                </CardFooter>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="subjects">
            <div className="mb-4">
              <h2 className="text-lg font-medium text-gray-900">Subject-wise Attendance</h2>
            </div>

            {attendanceData?.subjects?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {attendanceData.subjects.map((subject: any) => (
                  <Card key={subject.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{subject.name}</CardTitle>
                          <p className="text-sm text-gray-500">{subject.code}</p>
                        </div>
                        <div>
                          <Badge
                            variant={
                              subject.stats.percentage >= 75 ? "success" : 
                              subject.stats.percentage >= 60 ? "warning" : "destructive"
                            }
                          >
                            {subject.stats.percentage}%
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                      {/* Attendance progress bar */}
                      <div className="mb-3">
                        <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                          {/* Present */}
                          <div 
                            className="h-full bg-green-500 float-left"
                            style={{ width: `${(subject.stats.presentCount / subject.attendanceRecords.length) * 100}%` }}
                          ></div>
                          {/* Late */}
                          <div 
                            className="h-full bg-yellow-500 float-left"
                            style={{ width: `${(subject.stats.lateCount / subject.attendanceRecords.length) * 100}%` }}
                          ></div>
                          {/* Absent */}
                          <div 
                            className="h-full bg-red-500 float-left"
                            style={{ width: `${(subject.stats.absentCount / subject.attendanceRecords.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* Detailed stats */}
                      <div className="grid grid-cols-3 gap-2 text-center text-sm">
                        <div>
                          <p className="text-green-600 font-medium">{subject.stats.presentCount}</p>
                          <p className="text-gray-500">Present</p>
                        </div>
                        <div>
                          <p className="text-yellow-600 font-medium">{subject.stats.lateCount}</p>
                          <p className="text-gray-500">Late</p>
                        </div>
                        <div>
                          <p className="text-red-600 font-medium">{subject.stats.absentCount}</p>
                          <p className="text-gray-500">Absent</p>
                        </div>
                      </div>

                      <div className="mt-3 text-sm text-gray-500">
                        {subject.stats.percentage >= 75 ? (
                          <div className="flex items-center text-green-600">
                            <Check className="h-4 w-4 mr-1" />
                            Good standing
                          </div>
                        ) : subject.stats.percentage < 50 ? (
                          <div className="flex items-center text-red-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Attendance shortage
                          </div>
                        ) : (
                          <div className="flex items-center text-yellow-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Attendance needs improvement
                          </div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="bg-gray-50 flex justify-between py-3">
                      <p className="text-xs text-gray-500">
                        Updated: {new Date(subject.lastUpdated).toLocaleDateString()}
                      </p>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => {
                          setSelectedSubject(subject.id);
                          (document.querySelector('[data-value="records"]') as HTMLElement)?.click();
                        }}
                      >
                        View Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center bg-white rounded-md shadow">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You are not enrolled in any subjects with attendance records.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Attendance Policy Card */}
        <Card className="mt-8 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-700">Attendance Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-700 space-y-2">
              <p>• Minimum 75% attendance is required to be eligible for examinations.</p>
              <p>• Students with less than 75% but more than 60% attendance may apply for condonation with valid reasons.</p>
              <p>• Three late arrivals will be counted as one absence.</p>
              <p>• Medical certificates must be submitted within one week of returning to classes.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </StudentLayout>
  );
}
