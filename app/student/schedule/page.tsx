"use client";

import { useState, useEffect } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  CalendarDays, 
  Clock,
  MapPin,
  User,
  BookOpen
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
  facultyName: string;
  subjectName?: string;
}

export default function StudentSchedulePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [selectedDay, setSelectedDay] = useState<string>(getCurrentDay());
  const [todaySchedules, setTodaySchedules] = useState<ScheduleItem[]>([]);

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
        
        const response = await fetch('/api/admin/schedule'); // Reusing the same API endpoint
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

  // Color mapping for days
  const dayColorMap: Record<string, string> = {
    "Monday": "bg-blue-100 text-blue-800",
    "Tuesday": "bg-green-100 text-green-800",
    "Wednesday": "bg-purple-100 text-purple-800",
    "Thursday": "bg-amber-100 text-amber-800",
    "Friday": "bg-pink-100 text-pink-800",
    "Saturday": "bg-indigo-100 text-indigo-800",
    "Sunday": "bg-gray-100 text-gray-800",
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading your schedule..." />
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Schedule</h1>
            <p className="mt-1 text-sm text-gray-500">
              View your class schedule and manage your time effectively
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Badge className="bg-blue-500 text-white font-medium py-1.5">
              {new Date().toLocaleDateString(undefined, { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Badge>
          </div>
        </div>

        {/* Today's Classes */}
        <Card className="mb-8">
          <CardHeader className="pb-3">
            <CardTitle>Today's Classes</CardTitle>
            <CardDescription>
              Your schedule for {getCurrentDay()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaySchedules.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Clock className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No Classes Today</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Enjoy your free day or catch up on assignments!
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
                            ? 'border-l-blue-500' 
                            : 'border-l-gray-300 bg-gray-50/50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900 mb-2 truncate">
                          {schedule.courseName}
                        </h3>
                        
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
                            <User className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{schedule.facultyName}</span>
                          </div>
                        </div>
                        
                        {status === 'current' && (
                          <Badge className="mt-3 bg-green-500 text-white">
                            In Progress
                          </Badge>
                        )}
                        
                        {status === 'upcoming' && (
                          <div className="mt-3 text-xs text-blue-700">
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
            <CardTitle>Weekly Timetable</CardTitle>
            <CardDescription>
              Your class schedule for the entire week
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
                              <div key={schedule.id} className="py-3 first:pt-0 last:pb-0">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">
                                      {schedule.courseName}
                                    </h4>
                                    <div className="mt-1 grid grid-cols-2 gap-2 text-sm text-gray-500">
                                      <div className="flex items-center">
                                        <Clock className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                        <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <MapPin className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                        <span>{schedule.roomName}</span>
                                      </div>
                                      <div className="flex items-center">
                                        <User className="h-3.5 w-3.5 mr-1 text-gray-400" />
                                        <span className="truncate">{schedule.facultyName}</span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <Badge 
                                      variant="outline" 
                                      className="text-xs whitespace-nowrap"
                                    >
                                      {calculateDuration(schedule.startTime, schedule.endTime)} hrs
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
    </StudentLayout>
  );
}

// Helper function to calculate time until class starts
function calculateTimeUntil(startTime: string): string {
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
}

// Helper function to calculate class duration
function calculateDuration(startTime: string, endTime: string): string {
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
      return `${hours}`;
    } else {
      return `${hours}.${Math.floor(minutes / 6)}`;  // Represent minutes as decimal (e.g., 1.5 hrs)
    }
  } catch (error) {
    return "?";
  }
}
