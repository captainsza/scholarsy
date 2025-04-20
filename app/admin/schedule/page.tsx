"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  CalendarDays, 
  Plus, 
  Download, 
  Upload,
  Filter,
  School
} from "lucide-react";
import { toast } from "@/components/ui/toastall";
import ScheduleTable from "@/components/admin/schedule/ScheduleTable";
import ScheduleCalendar from "@/components/admin/schedule/ScheduleCalendar";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Types
interface Course {
  id: string;
  name: string;
  branch: string;
  year: string;
  semester: string;
}

interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
  facultyName: string;
  subjectName?: string;
}

export default function AdminSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [view, setView] = useState<"table" | "calendar">("table");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [filteredSchedules, setFilteredSchedules] = useState<ScheduleItem[]>([]);

  // Fetch schedules and courses
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch schedules
        const schedulesResponse = await fetch('/api/admin/schedule');
        if (!schedulesResponse.ok) {
          throw new Error('Failed to fetch schedules');
        }
        const schedulesData = await schedulesResponse.json();
        setSchedules(schedulesData.schedules || []);
        
        // Fetch courses for filtering
        const coursesResponse = await fetch('/api/admin/courses');
        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }
        const coursesData = await coursesResponse.json();
        setCourses(coursesData.courses || []);
      } catch (error) {
        console.error('Error loading schedule data:', error);
        toast({
          title: "Error",
          description: "Failed to load schedule data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Apply filters whenever filter values or schedules change
  useEffect(() => {
    let filtered = [...schedules];
    
    // Filter by day if a specific day is selected
    if (selectedDay !== "all") {
      filtered = filtered.filter(
        schedule => schedule.dayOfWeek.toLowerCase() === selectedDay.toLowerCase()
      );
    }
    
    // Filter by course if a specific course is selected
    if (selectedCourse !== "all") {
      filtered = filtered.filter(
        schedule => schedule.courseId === selectedCourse
      );
    }
    
    setFilteredSchedules(filtered);
  }, [schedules, selectedDay, selectedCourse]);

  const handleCreateSchedule = () => {
    router.push('/admin/schedule/create');
  };

  const handleExportSchedule = () => {
    // Implementation for exporting schedules (e.g., CSV, PDF)
    toast({
      title: "Export Started",
      description: "Your schedule data is being exported.",
    });
  };

  const resetFilters = () => {
    setSelectedDay("all");
    setSelectedCourse("all");
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage and organize class schedules across all courses
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={handleExportSchedule}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => router.push('/admin/schedule/import')}
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button
              onClick={handleCreateSchedule}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Schedule
            </Button>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle>Class Schedule</CardTitle>
            <CardDescription>
              View and manage institution-wide class schedules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* View Toggle and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <Tabs 
                defaultValue="table" 
                value={view} 
                onValueChange={(v) => setView(v as "table" | "calendar")}
                className="w-full md:w-auto"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="table">Table View</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <div className="w-full md:w-48">
                <Select
                  value={selectedDay}
                  onValueChange={setSelectedDay}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <CalendarDays className="w-4 h-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Filter by day" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Days</SelectItem>
                    <SelectItem value="monday">Monday</SelectItem>
                    <SelectItem value="tuesday">Tuesday</SelectItem>
                    <SelectItem value="wednesday">Wednesday</SelectItem>
                    <SelectItem value="thursday">Thursday</SelectItem>
                    <SelectItem value="friday">Friday</SelectItem>
                    <SelectItem value="saturday">Saturday</SelectItem>
                    <SelectItem value="sunday">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="w-full md:w-64">
                <Select
                  value={selectedCourse}
                  onValueChange={setSelectedCourse}
                >
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <School className="w-4 h-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Filter by course" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Courses</SelectItem>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} ({course.semester})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={resetFilters} 
                size="sm"
                className="w-full md:w-auto"
              >
                Reset Filters
              </Button>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <LoadingSpinner message="Loading schedules..." />
              </div>
            ) : (
              <>
                {view === "table" ? (
                  <ScheduleTable schedules={filteredSchedules} />
                ) : (
                  <ScheduleCalendar schedules={filteredSchedules} />
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Schedule Management Tips */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Scheduling Guidelines</CardTitle>
              <CardDescription>Best practices for effective scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                  </div>
                  <span>Avoid scheduling the same faculty for multiple classes at the same time</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                  </div>
                  <span>Allow sufficient breaks between classes</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                  </div>
                  <span>Consider faculty specializations when assigning subjects</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="rounded-full bg-blue-100 p-1 mt-0.5">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-600"></div>
                  </div>
                  <span>Balance the teaching load across the week</span>
                </li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Schedule Statistics</CardTitle>
              <CardDescription>Overview of current scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Total Classes Scheduled</p>
                  <p className="text-2xl font-bold">{schedules.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Most Active Day</p>
                  <p className="text-lg font-medium">
                    {schedules.length > 0 
                      ? getMostActiveDay(schedules)
                      : "No data available"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Courses with Complete Schedules</p>
                  <p className="text-lg font-medium">
                    {getCoursesWithCompleteSchedules(schedules, courses)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

// Helper function to calculate the most active day
function getMostActiveDay(schedules: ScheduleItem[]): string {
  if (schedules.length === 0) return "N/A";
  
  const dayCounts: Record<string, number> = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
    saturday: 0,
    sunday: 0
  };
  
  schedules.forEach(schedule => {
    const day = schedule.dayOfWeek.toLowerCase();
    if (dayCounts[day] !== undefined) {
      dayCounts[day] += 1;
    }
  });
  
  let mostActiveDay = "monday";
  let maxCount = 0;
  
  Object.entries(dayCounts).forEach(([day, count]) => {
    if (count > maxCount) {
      mostActiveDay = day;
      maxCount = count;
    }
  });
  
  // Capitalize first letter
  return mostActiveDay.charAt(0).toUpperCase() + mostActiveDay.slice(1);
}

// Helper function to count courses with complete schedules
function getCoursesWithCompleteSchedules(schedules: ScheduleItem[], courses: Course[]): string {
  if (courses.length === 0) return "0/0";
  
  const coursesWithSchedules = new Set(schedules.map(s => s.courseId));
  const completeCourses = coursesWithSchedules.size;
  
  return `${completeCourses}/${courses.length}`;
}
