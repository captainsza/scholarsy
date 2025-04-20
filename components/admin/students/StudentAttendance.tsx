"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Check, 
  Clock, 
  Filter, 
  X,
  BarChart3,
  CalendarDays,
  ChevronDown
} from "lucide-react";
import { formatDistanceToNow, format, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface AttendanceRecord {
  id: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "LATE";
  courseName: string;
  courseCode: string;
  subjectName?: string;
  subjectCode?: string;
  faculty?: {
    name: string;
  };
}

interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
  courseWise: {
    [courseId: string]: {
      courseName: string;
      total: number;
      present: number;
      absent: number;
      late: number;
      percentage: number;
    };
  };
}

interface StudentAttendanceProps {
  studentId: string;
}

export default function StudentAttendance({ studentId }: StudentAttendanceProps) {
  const [loading, setLoading] = useState(true);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<AttendanceRecord[]>([]);
  const [summary, setSummary] = useState<AttendanceSummary | null>(null);
  const [courseFilter, setCourseFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{
    from: Date | null;
    to: Date | null;
  }>({
    from: null,
    to: null,
  });
  const [courses, setCourses] = useState<{ id: string; name: string }[]>([]);

  // Fetch attendance data
  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/admin/students/${studentId}/attendance`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch attendance data');
        }
        
        const data = await response.json();
        setAttendanceRecords(data.attendanceRecords || []);
        setSummary(data.summary || null);
        
        // Extract unique courses
        const uniqueCourses = [...new Set(data.attendanceRecords.map((record: AttendanceRecord) => record.courseCode))];
        setCourses(
          uniqueCourses.map((code: string) => {
            const record = data.attendanceRecords.find((r: AttendanceRecord) => r.courseCode === code);
            return {
              id: code,
              name: record ? `${code}: ${record.courseName}` : code,
            };
          })
        );
        
        // Initially set filtered records to all records
        setFilteredRecords(data.attendanceRecords || []);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
        toast({
          title: "Error",
          description: "Failed to load attendance data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (studentId) {
      fetchAttendanceData();
    }
  }, [studentId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...attendanceRecords];
    
    // Apply course filter
    if (courseFilter !== "all") {
      filtered = filtered.filter(record => record.courseCode === courseFilter);
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(record => record.status === statusFilter);
    }
    
    // Apply date range filter
    if (dateRange.from || dateRange.to) {
      filtered = filtered.filter(record => {
        const recordDate = parseISO(record.date);
        if (dateRange.from && dateRange.to) {
          return (
            (isAfter(recordDate, dateRange.from) || isEqual(recordDate, dateRange.from)) && 
            (isBefore(recordDate, dateRange.to) || isEqual(recordDate, dateRange.to))
          );
        } else if (dateRange.from) {
          return isAfter(recordDate, dateRange.from) || isEqual(recordDate, dateRange.from);
        } else if (dateRange.to) {
          return isBefore(recordDate, dateRange.to) || isEqual(recordDate, dateRange.to);
        }
        return true;
      });
    }
    
    setFilteredRecords(filtered);
  }, [attendanceRecords, courseFilter, statusFilter, dateRange]);

  const resetFilters = () => {
    setCourseFilter("all");
    setStatusFilter("all");
    setDateRange({ from: null, to: null });
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PRESENT":
        return <Badge className="bg-green-100 text-green-800 border-0">Present</Badge>;
      case "ABSENT":
        return <Badge className="bg-red-100 text-red-800 border-0">Absent</Badge>;
      case "LATE":
        return <Badge className="bg-yellow-100 text-yellow-800 border-0">Late</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 border-0">Unknown</Badge>;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading attendance data..." />;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Classes</p>
                  <p className="text-2xl font-bold">{summary.total}</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Present</p>
                  <p className="text-2xl font-bold">{summary.present}</p>
                </div>
                <div className="p-3 rounded-full bg-green-100 text-green-600">
                  <Check className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Absent</p>
                  <p className="text-2xl font-bold">{summary.absent}</p>
                </div>
                <div className="p-3 rounded-full bg-red-100 text-red-600">
                  <X className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-500">Attendance Rate</p>
                  <p className="text-2xl font-bold">{summary.percentage.toFixed(1)}%</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Attendance Records</CardTitle>
              <CardDescription>View detailed attendance history</CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {}}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="w-full md:w-48">
              <Select
                value={courseFilter}
                onValueChange={setCourseFilter}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Filter by course" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Courses</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full md:w-48">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger>
                  <div className="flex items-center">
                    <Filter className="w-4 h-4 mr-2 text-gray-500" />
                    <SelectValue placeholder="Filter by status" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="PRESENT">Present</SelectItem>
                  <SelectItem value="ABSENT">Absent</SelectItem>
                  <SelectItem value="LATE">Late</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full md:w-auto flex-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full">
                    <CalendarDays className="mr-2 h-4 w-4" />
                    {dateRange.from || dateRange.to ? (
                      <>
                        {dateRange.from ? format(dateRange.from, "MMM d, yyyy") : "Start"} - 
                        {dateRange.to ? format(dateRange.to, "MMM d, yyyy") : "End"}
                      </>
                    ) : (
                      "Select date range"
                    )}
                    <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  {/* Here would go a date picker component */}
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-gray-500">Coming soon! Date picker will be integrated here.</p>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setDateRange({ from: null, to: null })}
                      >
                        Clear
                      </Button>
                      <Button size="sm">Apply</Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              Reset
            </Button>
          </div>

          {/* Attendance Table */}
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No Attendance Records</h3>
              <p className="text-gray-500">
                {attendanceRecords.length > 0 
                  ? "No records match your filter criteria."
                  : "There are no attendance records for this student yet."}
              </p>
              {attendanceRecords.length > 0 && (
                <Button variant="outline" className="mt-4" onClick={resetFilters}>
                  Reset Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Faculty</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="font-medium">{format(parseISO(record.date), "MMM d, yyyy")}</div>
                        <div className="text-xs text-gray-500">{formatDistanceToNow(parseISO(record.date), { addSuffix: true })}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{record.courseCode}</div>
                        <div className="text-xs text-gray-500">{record.courseName}</div>
                      </TableCell>
                      <TableCell>
                        {record.subjectCode ? (
                          <>
                            <div className="font-medium">{record.subjectCode}</div>
                            <div className="text-xs text-gray-500">{record.subjectName}</div>
                          </>
                        ) : (
                          <span className="text-gray-500">Not specified</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.faculty?.name || <span className="text-gray-500">Not specified</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination would go here */}
        </CardContent>
      </Card>

      {/* Course-wise Attendance Summary */}
      {summary && Object.keys(summary.courseWise).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Course-wise Attendance</CardTitle>
            <CardDescription>Attendance breakdown by course</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {Object.entries(summary.courseWise).map(([courseId, courseSummary]) => (
                <div key={courseId} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-gray-900">{courseSummary.courseName}</h4>
                    <span className="text-sm font-medium">
                      {courseSummary.percentage.toFixed(1)}% ({courseSummary.present}/{courseSummary.total})
                    </span>
                  </div>
                  <Progress 
                    value={courseSummary.percentage} 
                    className="h-2"
                  />
                  <div className="grid grid-cols-3 gap-2 text-xs text-gray-500">
                    <div>Present: {courseSummary.present}</div>
                    <div>Absent: {courseSummary.absent}</div>
                    <div>Late: {courseSummary.late}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
