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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import ScheduleTable from "@/components/admin/schedule/ScheduleTable";
import ScheduleCalendar from "@/components/admin/schedule/ScheduleCalendar";
import { Calendar, Grid, List, Plus } from "lucide-react";

export default function SchedulePage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState("list");
  const [courses, setCourses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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
              className={`px-4 py-2 flex items-center ${
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
              className={`px-4 py-2 flex items-center ${
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
              {selectedCourse && courses.find(c => c.id === selectedCourse)?.name}
              {selectedDay && (selectedCourse ? ` on ${selectedDay}` : `${selectedDay}`)}
              {selectedRoom && rooms.find(r => r.id === selectedRoom)?.name}
              {!selectedCourse && !selectedDay && !selectedRoom && "All scheduled classes"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {viewMode === "list" ? (
              <ScheduleTable filter={filters} />
            ) : (
              <div>
                {loading ? (
                  <div className="text-center py-10">Loading schedule data...</div>
                ) : (
                  <ScheduleCalendar schedules={[]} /> // Replace with actual schedule data
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
