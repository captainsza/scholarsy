"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";
import {
  Calendar,
  Check,
  Clock,
  X,
  BarChart3,
  Filter,
  Search,
  Plus,
  Users,
  BookOpen,
} from "lucide-react";

export default function FacultyAttendanceDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [subjects, setSubjects] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [attendanceStats, setAttendanceStats] = useState<any>({
    total: 0,
    present: 0,
    absent: 0,
    late: 0
  });

  useEffect(() => {
    const fetchAttendanceData = async () => {
      if (!user?.faculty?.id) return;
      
      try {
        setLoading(true);
        
        // Fetch all subjects taught by the faculty
        const subjectsResponse = await fetch(`/api/faculty/subjects?facultyId=${user.faculty.id}`);
        
        if (!subjectsResponse.ok) {
          throw new Error("Failed to fetch subjects");
        }
        
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
        
        // Fetch recent attendance records
        const attendanceResponse = await fetch(`/api/faculty/attendance/recent?facultyId=${user.faculty.id}`);
        
        if (!attendanceResponse.ok) {
          throw new Error("Failed to fetch attendance records");
        }
        
        const attendanceData = await attendanceResponse.json();
        setRecentAttendance(attendanceData.records || []);
        
        // Set attendance statistics
        if (attendanceData.statistics) {
          setAttendanceStats(attendanceData.statistics);
        }
        
      } catch (err: any) {
        console.error("Error fetching attendance data:", err);
        setError(err.message || "Failed to load attendance data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchAttendanceData();
  }, [user]);

  // Filter subjects based on search term - with null checks
  const filteredSubjects = subjects.filter(subject => 
    // Check if subject exists and has required properties before filtering
    subject && (
      (subject.name && subject.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subject.code && subject.code.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (subject.courseName && subject.courseName.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  );

  // Filter attendance records based on selected subject
  const filteredAttendance = selectedSubject === "all" 
    ? recentAttendance 
    : recentAttendance.filter(record => record && record.subjectId === selectedSubject);

  if (loading) {
    return (
      <FacultyLayout>
        <LoadingSpinner message="Loading attendance dashboard..." />
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and track student attendance across all your subjects
            </p>
          </div>

          {/* Date indicator */}
          <div className="mt-4 md:mt-0">
            <div className="bg-blue-50 px-4 py-2 rounded-md">
              <p className="text-blue-700 text-sm font-medium">
                Today: {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Attendance Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-700">Total Classes</p>
                  <p className="mt-1 text-3xl font-bold text-blue-900">{attendanceStats.total || 0}</p>
                </div>
                <div className="h-12 w-12 bg-blue-200 rounded-full flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Present</p>
                  <p className="mt-1 text-3xl font-bold text-green-900">{attendanceStats.present || 0}</p>
                </div>
                <div className="h-12 w-12 bg-green-200 rounded-full flex items-center justify-center">
                  <Check className="h-6 w-6 text-green-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Absent</p>
                  <p className="mt-1 text-3xl font-bold text-red-900">{attendanceStats.absent || 0}</p>
                </div>
                <div className="h-12 w-12 bg-red-200 rounded-full flex items-center justify-center">
                  <X className="h-6 w-6 text-red-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">Late</p>
                  <p className="mt-1 text-3xl font-bold text-yellow-900">{attendanceStats.late || 0}</p>
                </div>
                <div className="h-12 w-12 bg-yellow-200 rounded-full flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-700" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subjects" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="subjects">Your Subjects</TabsTrigger>
            <TabsTrigger value="recent">Recent Attendance</TabsTrigger>
          </TabsList>

          {/* Subjects Tab */}
          <TabsContent value="subjects">
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Search subjects..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="flex space-x-2">
                <Button variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Take New Attendance
                </Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Your Teaching Subjects</CardTitle>
                <CardDescription>Select a subject to take or view attendance</CardDescription>
              </CardHeader>
              <CardContent>
                {filteredSubjects.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredSubjects.map((subject) => (
                      <Card key={subject.id} className="overflow-hidden border-2 hover:border-blue-200 transition-colors">
                        <CardHeader className="bg-gray-50 pb-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{subject.name || "Unnamed Subject"}</CardTitle>
                              <p className="text-xs text-gray-500 mt-1">
                                {subject.code || "No Code"} • {subject.courseName || "No Course"}
                              </p>
                            </div>
                            <Badge variant="outline">{subject.courseBranch || subject.courseYear || "N/A"}</Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-4">
                          <div className="mb-4">
                            <p className="text-sm text-gray-500 flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              {subject.studentCount || 0} Students
                            </p>
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <BookOpen className="h-4 w-4 mr-2" />
                              {subject.creditHours || 0} Credit Hours
                            </p>
                          </div>
                        </CardContent>
                        <CardFooter className="bg-gray-50 flex justify-between">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/faculty/subjects/${subject.id}/attendance`)}
                          >
                            View Records
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => router.push(`/faculty/subjects/${subject.id}/attendance/take`)}
                          >
                            <Check className="mr-2 h-4 w-4" />
                            Take Attendance
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No subjects found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchTerm ? "No subjects match your search." : "You don't have any assigned subjects."}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recent Attendance Tab */}
          <TabsContent value="recent">
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="w-full sm:w-64">
                <Select
                  value={selectedSubject}
                  onValueChange={setSelectedSubject}
                >
                  <SelectTrigger>
                    <div className="flex items-center">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Filter by subject" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.code || "No Code"} - {subject.name || "Unnamed Subject"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Attendance Records</CardTitle>
                <CardDescription>
                  {selectedSubject === "all" 
                    ? "Showing recent attendance across all subjects" 
                    : `Filtered by ${subjects.find(s => s.id === selectedSubject)?.name || "selected subject"}`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredAttendance.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Subject</TableHead>
                          <TableHead>Course</TableHead>
                          <TableHead>Students Count</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredAttendance.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell>{record.formattedDate || "N/A"}</TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{record.subjectName || "N/A"}</div>
                                <div className="text-sm text-gray-500">{record.subjectCode || "No Code"}</div>
                              </div>
                            </TableCell>
                            <TableCell>{record.courseName || "N/A"}</TableCell>
                            <TableCell>{record.studentsCount || 0}</TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => router.push(`/faculty/subjects/${record.subjectId}/attendance?date=${record.date}`)}
                              >
                                View Details
                              </Button>
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
                      {selectedSubject !== "all" ? "No records found for selected subject." : "You haven't recorded any attendance yet."}
                    </p>
                    {subjects.length > 0 && (
                      <Button 
                        onClick={() => router.push(`/faculty/subjects/${subjects[0]?.id}/attendance/take`)}
                        className="mt-4"
                      >
                        Take Attendance
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
              {filteredAttendance.length > 0 && (
                <CardFooter className="flex justify-between border-t px-6 py-4">
                  <div className="text-sm text-gray-500">
                    Showing {filteredAttendance.length} attendance sessions
                  </div>
                  <Button variant="outline" size="sm">
                    View All Records
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
