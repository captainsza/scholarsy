"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import ScheduleTable from "@/components/admin/schedule/ScheduleTable";
import ScheduleCalendar from "@/components/admin/schedule/ScheduleCalendar";
import { Calendar, Grid, List, Plus } from "lucide-react";

interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
  facultyName: string;
}

export default function SchedulePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState("list");
  const [courses, setCourses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [schedulesLoading, setSchedulesLoading] = useState(false);

  // Filter states
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedDay, setSelectedDay] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");

  // Fetch courses and rooms for filters
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch courses
        const coursesRes = await fetch('/api/admin/courses');
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses || []);
        }

        // Fetch rooms
        const roomsRes = await fetch('/api/admin/rooms');
        if (roomsRes.ok) {
          const roomsData = await roomsRes.json();
          setRooms(roomsData.rooms || []);
        }

      } catch (error) {
        console.error('Error fetching filter data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch schedules when filters change
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setSchedulesLoading(true);
        
        // Build query parameters
        const params = new URLSearchParams();
        if (selectedCourse !== "all") params.append('courseId', selectedCourse);
        if (selectedDay !== "all") params.append('dayOfWeek', selectedDay);
        if (selectedRoom !== "all") params.append('roomId', selectedRoom);
        
        const queryString = params.toString();
        const url = `/api/admin/schedule${queryString ? `?${queryString}` : ''}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setSchedules(data.schedules || []);
        } else {
          console.error('Failed to fetch schedules');
          setSchedules([]);
        }
      } catch (error) {
        console.error('Error fetching schedules:', error);
        setSchedules([]);
      } finally {
        setSchedulesLoading(false);
      }
    };

    fetchSchedules();
  }, [selectedCourse, selectedDay, selectedRoom]);

  // Filter object to pass to components
  const filters = {
    courseId: selectedCourse !== "all" ? selectedCourse : undefined,
    dayOfWeek: selectedDay !== "all" ? selectedDay : undefined,
    roomId: selectedRoom !== "all" ? selectedRoom : undefined,
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Class Schedules</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage class schedules, rooms, and faculty assignments
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button
              onClick={() => router.push("/admin/schedule/create")}
              className="flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Schedule
            </Button>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Course Filter */}
          <Select 
            value={selectedCourse} 
            onValueChange={setSelectedCourse}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {courses.map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.name} - {course.branch}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Day Filter */}
          <Select 
            value={selectedDay} 
            onValueChange={setSelectedDay}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Day" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Days</SelectItem>
              {days.map((day) => (
                <SelectItem key={day} value={day}>
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Room Filter */}
          <Select 
            value={selectedRoom} 
            onValueChange={setSelectedRoom}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by Room" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rooms</SelectItem>
              {rooms.map((room) => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {/* View toggles */}
        <div className="mb-6">
          <div className="border rounded-md inline-flex">
            <button
              onClick={() => setViewMode("list")}
              className={`px-4 py-2 flex items-center rounded-l-md ${
                viewMode === "list"
                  ? "bg-cyan-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </button>
            <button
              onClick={() => setViewMode("calendar")}
              className={`px-4 py-2 flex items-center rounded-r-md ${
                viewMode === "calendar"
                  ? "bg-cyan-500 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Calendar View
            </button>
          </div>
        </div>

        {/* Schedule content */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Class Schedule</CardTitle>
            <CardDescription>
              {selectedCourse !== "all" && courses.find(c => c.id === selectedCourse)?.name}
              {selectedDay !== "all" && (selectedCourse !== "all" ? ` on ${selectedDay}` : `${selectedDay}`)}
              {selectedRoom !== "all" && ` in ${rooms.find(r => r.id === selectedRoom)?.name}`}
              {selectedCourse === "all" && selectedDay === "all" && selectedRoom === "all" && "All scheduled classes"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {schedulesLoading ? (
              <div className="text-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-500 mx-auto mb-4"></div>
                <p className="text-gray-500">Loading schedule data...</p>
              </div>
            ) : viewMode === "list" ? (
              <ScheduleTable filter={filters} />
            ) : (
              <ScheduleCalendar schedules={schedules} />
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
