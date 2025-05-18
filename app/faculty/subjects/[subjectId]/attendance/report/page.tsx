"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
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
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import { toast } from "@/components/ui/toastall";
import { ArrowLeft, Download, Users, CalendarCheck, Percent, AlertCircle, FileText } from "lucide-react";

interface ReportPageParams {
  subjectId: string;
}

interface SubjectInfo {
  id: string;
  name: string;
  code: string;
  courseName: string;
}

interface StudentSummary {
  studentId: string;
  studentName: string;
  enrollmentId: string;
  profileImage?: string;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  totalSessionsAttendedByStudent: number;
  attendancePercentage: number;
}

interface OverallStats {
  totalDistinctSessions: number;
  totalStudents: number;
  totalAttendanceEntries: number;
  totalPresentOverall: number;
  totalAbsentOverall: number;
  totalLateOverall: number;
  overallAttendancePercentage: number;
}

interface ReportData {
  subjectInfo: SubjectInfo;
  studentAttendanceSummaries: StudentSummary[];
  overallReportStats: OverallStats;
}

export default function AttendanceReportPage() {
  const router = useRouter();
  const params = useParams() as unknown as ReportPageParams;
  const { subjectId } = params;
  const { user, loading: authLoading } = useAuth();

  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      if (!subjectId || !user?.faculty?.id) {
        if (!authLoading) {
            setError("Access denied or missing information.");
            setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`/api/faculty/subjects/${subjectId}/attendance/report`);
        
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || `Failed to fetch report data (${response.status})`);
        }
        const data = await response.json();
        setReportData(data);
      } catch (err: any) {
        console.error("Error fetching attendance report:", err);
        setError(err.message || "Could not load report data.");
        toast({
          title: "Error",
          description: err.message || "Failed to load report data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user?.faculty?.id) {
        fetchReportData();
    }
  }, [subjectId, user, authLoading, user?.faculty?.id]);

  if (authLoading || loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center min-h-screen -mt-16">
          <LoadingSpinner message="Generating attendance report..." />
        </div>
      </FacultyLayout>
    );
  }

  if (error) {
    return (
      <FacultyLayout>
        <div className="p-8 max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Report</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </FacultyLayout>
    );
  }

  if (!reportData) {
    return (
      <FacultyLayout>
        <div className="p-8 text-center">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No report data available for this subject.</p>
           <Button onClick={() => router.back()} className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
          </Button>
        </div>
      </FacultyLayout>
    );
  }

  const { subjectInfo, studentAttendanceSummaries, overallReportStats } = reportData;

  // Helper function to determine Progress component colors based on percentage
  const getProgressColorClass = (percentage: number) => {
    if (percentage >= 75) return "bg-green-500";
    if (percentage >= 50) return "bg-yellow-500";
    return "bg-red-500";
  };

  // Helper function to calculate percentage text color
  const getPercentageColorClass = (percentage: number) => {
    if (percentage >= 75) return "text-green-600";
    if (percentage >= 50) return "text-yellow-600";
    return "text-red-600";
  };
  
  // Helper function to export attendance data as CSV
  const exportToCSV = () => {
    // CSV Headers
    let csv = 'Student Name,Enrollment ID,Present,Absent,Late,Sessions Attended,Total Sessions,Attendance Percentage\n';
    
    // Add data for each student
    studentAttendanceSummaries.forEach(student => {
      csv += `"${student.studentName}",${student.enrollmentId},${student.presentCount},${student.absentCount},${student.lateCount},${student.totalSessionsAttendedByStudent},${overallReportStats.totalDistinctSessions},${student.attendancePercentage}%\n`;
    });
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${subjectInfo.code}_attendance_report.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="mr-2">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Attendance Report</h1>
              <p className="text-sm text-gray-500">
                {subjectInfo.name} ({subjectInfo.code}) - {subjectInfo.courseName}
              </p>
            </div>
          </div>
          <Button variant="outline" onClick={exportToCSV}>
            <Download className="mr-2 h-4 w-4" /> Export Report (CSV)
          </Button>
        </div>

        {/* Overall Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Overall Subject Statistics</CardTitle>
            <CardDescription>Summary of attendance for all students in this subject.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatDisplay icon={CalendarCheck} label="Total Sessions" value={overallReportStats.totalDistinctSessions.toString()} />
              <StatDisplay icon={Users} label="Enrolled Students" value={overallReportStats.totalStudents.toString()} />
              <StatDisplay icon={Percent} label="Overall Attendance" value={`${overallReportStats.overallAttendancePercentage}%`} />
              <StatDisplay icon={FileText} label="Total Records" value={overallReportStats.totalAttendanceEntries.toString()} />
            </div>
            <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Attendance Breakdown (Overall Entries):</h4>
                <div className="flex items-center space-x-4 text-sm">
                    <Badge variant="success">Present: {overallReportStats.totalPresentOverall}</Badge>
                    <Badge variant="destructive">Absent: {overallReportStats.totalAbsentOverall}</Badge>
                    <Badge variant="warning">Late: {overallReportStats.totalLateOverall}</Badge>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Student Attendance Summaries */}
        <Card>
          <CardHeader>
            <CardTitle>Student Attendance Summary</CardTitle>
            <CardDescription>Individual attendance statistics for each student.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Enrollment ID</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-center">Sessions Marked / Total</TableHead>
                    <TableHead>Attendance %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentAttendanceSummaries.length > 0 ? studentAttendanceSummaries.map((student) => (
                    <TableRow key={student.studentId}>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-9 w-9 mr-3">
                            <AvatarImage src={student.profileImage || undefined} alt={student.studentName} />
                            <AvatarFallback>
                              {student.studentName?.split(" ").map(n => n[0]).join("").toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{student.studentName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-600">{student.enrollmentId}</TableCell>
                      <TableCell className="text-center text-green-600 font-medium">{student.presentCount}</TableCell>
                      <TableCell className="text-center text-red-600 font-medium">{student.absentCount}</TableCell>
                      <TableCell className="text-center text-yellow-600 font-medium">{student.lateCount}</TableCell>
                      <TableCell className="text-center text-gray-600">{student.totalSessionsAttendedByStudent} / {overallReportStats.totalDistinctSessions}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Progress 
                            value={student.attendancePercentage} 
                            className="w-20 h-2 mr-2"
                          />
                          <span className={`font-medium ${getPercentageColorClass(student.attendancePercentage)}`}>
                            {student.attendancePercentage}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-gray-500">
                            No students enrolled or no attendance data available for students in this subject.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
           {studentAttendanceSummaries.length > 0 && (
            <CardFooter className="border-t pt-4">
                <p className="text-sm text-gray-500">
                    Showing {studentAttendanceSummaries.length} students. 
                    Attendance percentage is (Present + Late) / Total Distinct Subject Sessions.
                </p>
            </CardFooter>
           )}
        </Card>
      </div>
    </FacultyLayout>
  );
}

// UI component for displaying statistics with an icon
const StatDisplay = ({ icon: Icon, label, value }: { icon: React.ElementType, label: string, value: string }) => (
  <div className="bg-gray-50 p-4 rounded-lg flex items-center">
    <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
      <Icon className="h-6 w-6" />
    </div>
    <div>
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-xl font-semibold text-gray-800">{value}</p>
    </div>
  </div>
);
