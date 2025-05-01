"use client";

import { useState, useEffect } from "react";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Calendar, 
  Clock,
  MapPin,
  Briefcase,
  BookOpen,
  Users
} from "lucide-react";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/Badge";

// Types
interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
  class: string;
  subjectName?: string;
  subjectCode?: string;
}

export default function FacultySchedulePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(getCurrentDay());
  const [todaySchedules, setTodaySchedules] = useState<ScheduleItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Get current day of week
  function getCurrentDay() {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayIndex = new Date().getDay();
    return days[dayIndex];
  }

  // Fetch schedules
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/faculty/schedule');
        if (!response.ok) {
          throw new Error('Failed to fetch schedules');
        }
        
        const data = await response.json();
        setSchedules(data.schedules || []);
        
        // Set today's schedules
        const today = getCurrentDay();
        setTodaySchedules(
          data.schedules.filter((schedule: ScheduleItem) => 
            schedule.dayOfWeek === today
          ).sort((a: ScheduleItem, b: ScheduleItem) => 
            a.startTime.localeCompare(b.startTime)
          )
        );
      } catch (error) {
        console.error('Error loading schedule data:', error);
        setError('Failed to load your schedule. Please try again.');
        toast({
          title: "Error",
          description: "Failed to load your schedule. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSchedules();
  }, []);

  // Group schedules by day
  const schedulesByDay = schedules.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);

  // Format time to 12-hour format
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    } catch (error) {
      return time;
    }
  };

  // Check if a schedule is current/upcoming/past
  const getScheduleStatus = (schedule: ScheduleItem) => {
    const now = new Date();
    const currentDay = getCurrentDay();
    
    if (schedule.dayOfWeek !== currentDay) {
      return "upcoming"; // Different day
    }
    
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(startHour, startMinute, 0);
    const endDate = new Date();
    endDate.setHours(endHour, endMinute, 0);
    
    if (now < startDate) {
      return "upcoming";
    } else if (now >= startDate && now <= endDate) {
      return "current";
    } else {
      return "past";
    }
  };

  // Calculate time until class starts
  const calculateTimeUntil = (startTime: string): string => {
    try {
      const [hours, minutes] = startTime.split(':').map(Number);
      const now = new Date();
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0);
      
      // If start time is in the past for today, return empty string
      if (now > startDate) return "";
      
      const diffMs = startDate.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else {
        return `${diffMinutes} minutes`;
      }
    } catch (error) {
      return "";
    }
  };

  // Calculate class duration
  const calculateDuration = (startTime: string, endTime: string): string => {
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Calculate total minutes
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      const durationMinutes = endMinutes - startMinutes;
      
      // Convert to hours and minutes
      const hours = Math.floor(durationMinutes / 60);
      const minutes = durationMinutes % 60;
      
      if (hours === 0) {
        return `${minutes} min`;
      } else if (minutes === 0) {
        return `${hours} hr`;
      } else {
        return `${hours} hr ${minutes} min`;
      }
    } catch (error) {
      return "?";
    }
  };

  // Color mapping for days
  const dayColorMap: Record<string, string> = {
    "Monday": "bg-indigo-100 text-indigo-800",
    "Tuesday": "bg-green-100 text-green-800",
    "Wednesday": "bg-purple-100 text-purple-800",
    "Thursday": "bg-amber-100 text-amber-800",
    "Friday": "bg-pink-100 text-pink-800",
    "Saturday": "bg-blue-100 text-blue-800",
    "Sunday": "bg-gray-100 text-gray-800",
  };

  if (loading) {
    return (
      <FacultyLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading your teaching schedule..." />
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Teaching Schedule</h1>
            <p className="mt-1 text-sm text-gray-500">
              View and manage your teaching schedule across all subjects
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge className="bg-indigo-500 text-white font-medium py-1.5">
              {new Date().toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Badge>
          </div>
        </div>

        {error && (
          <Card className="mb-6 border-red-200">
            <CardContent className="p-4 text-red-700">
              {error}
            </CardContent>
          </Card>
        )}

        {/* Today's Classes */}
        <Card className="mb-8">
          <CardHeader className="pb-3 bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardTitle>Today's Teaching Schedule</CardTitle>
            <CardDescription>
              Your classes for {getCurrentDay()}
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {todaySchedules.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Classes Today</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any teaching scheduled for today
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {todaySchedules.map((schedule) => {
                  const status = getScheduleStatus(schedule);
                  return (
                    <Card 
                      key={schedule.id} 
                      className={`overflow-hidden border-l-4 ${
                        status === 'current' 
                          ? 'border-l-green-500 bg-green-50/50' 
                          : status === 'upcoming' 
                            ? 'border-l-indigo-500' 
                            : 'border-l-gray-300 bg-gray-50/50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="mb-1 flex items-center">
                          <Badge className="bg-indigo-100 text-indigo-800 mr-2">{schedule.subjectCode}</Badge>
                          {status === 'current' && (
                            <Badge className="bg-green-500 text-white">
                              In Progress
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
                          {schedule.subjectName || schedule.courseName}
                        </h3>
                        
                        <p className="text-sm text-gray-500 mb-3">{schedule.courseName}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center text-gray-700">
                            <Clock className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{schedule.roomName}</span>
                          </div>
                          
                          <div className="flex items-center text-gray-700">
                            <Users className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{schedule.class}</span>
                          </div>
                        </div>
                        
                        {status === 'upcoming' && (
                          <div className="mt-3 text-xs text-indigo-700">
                            Starting in {calculateTimeUntil(schedule.startTime)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Weekly Teaching Timetable</CardTitle>
            <CardDescription>
              Your complete teaching schedule for the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={selectedDay} onValueChange={setSelectedDay} className="mb-6">
              <TabsList className="grid grid-cols-7">
                {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                  <TabsTrigger key={day} value={day} className="text-xs md:text-sm">
                    {day.slice(0, 3)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => (
                <TabsContent key={day} value={day}>
                  <Card>
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-lg">
                          <Badge className={dayColorMap[day] || "bg-gray-100 text-gray-800"}>
                            {day}
                          </Badge>
                        </CardTitle>
                        <Badge variant="outline">
                          {schedulesByDay[day]?.length || 0} Classes
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-2">
                      {!schedulesByDay[day] || schedulesByDay[day].length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                          <BookOpen className="mx-auto h-8 w-8 text-gray-400" />
                          <p className="mt-2 text-gray-500">No classes scheduled</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {schedulesByDay[day]
                            .sort((a, b) => a.startTime.localeCompare(b.startTime))
                            .map((schedule) => (
                              <div key={schedule.id} className="py-4 first:pt-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center">
                                      <Badge className="bg-indigo-100 text-indigo-800 mr-2">{schedule.subjectCode}</Badge>
                                      <h4 className="font-medium text-gray-900">
                                        {schedule.subjectName || schedule.courseName}
                                      </h4>
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">{schedule.courseName}</p>
                                    <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-500">
                                      <div className="flex items-center">
                                        <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                        <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                        <span>{schedule.roomName}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <Users className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                        <span className="truncate">{schedule.class}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs whitespace-nowrap"
                                    >
                                      {calculateDuration(schedule.startTime, schedule.endTime)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </FacultyLayout>
  );
}
