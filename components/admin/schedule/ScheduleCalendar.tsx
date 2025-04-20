"use client";

import { Calendar } from "lucide-react";
import { useMemo } from "react";

interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomName: string;
  facultyName: string;
}

interface ScheduleCalendarProps {
  schedules: ScheduleItem[];
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8 AM to 9 PM

export default function ScheduleCalendar({ schedules }: ScheduleCalendarProps) {
  // Group schedules by day and time
  const scheduleMap = useMemo(() => {
    const map: Record<string, Record<string, ScheduleItem[]>> = {};
    
    // Initialize the map with all days and hours
    DAYS.forEach(day => {
      map[day] = {};
      HOURS.forEach(hour => {
        map[day][`${hour}:00`] = [];
      });
    });
    
    // Fill in the schedules
    schedules.forEach(schedule => {
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const timeKey = `${startHour}:00`;
      
      // Only add if the hour is in our display range
      if (HOURS.includes(startHour) && map[schedule.dayOfWeek]) {
        map[schedule.dayOfWeek][timeKey].push(schedule);
      }
    });
    
    return map;
  }, [schedules]);
  
  // Color map for different courses to make them visually distinguishable
  const getCourseColor = (courseId: string) => {
    // Create a deterministic hash for the course ID
    const hash = courseId.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    // List of color pairs (background, text)
    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-purple-100 text-purple-800",
      "bg-amber-100 text-amber-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
      "bg-cyan-100 text-cyan-800",
      "bg-emerald-100 text-emerald-800",
      "bg-violet-100 text-violet-800",
      "bg-rose-100 text-rose-800",
    ];
    
    return colors[hash % colors.length];
  };
  
  // Format time to 12-hour format
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    } catch (error) {
      return time;
    }
  };
  
  const calculateDuration = (startTime: string, endTime: string) => {
    try {
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);
      
      // Calculate total minutes
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      // Return duration in hours with 1 decimal place
      return ((endMinutes - startMinutes) / 60).toFixed(1);
    } catch (error) {
      return "?";
    }
  };
  
  if (schedules.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No class schedules are currently available to display.
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1000px]">
        {/* Calendar Header */}
        <div className="grid grid-cols-8 bg-gray-50 rounded-t-md">
          <div className="p-2 text-center font-medium border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
            Time
          </div>
          {DAYS.map(day => (
            <div key={day} className="p-2 text-center font-medium border-r border-gray-200">
              {day}
            </div>
          ))}
        </div>
        
        {/* Calendar Body */}
        <div className="divide-y divide-gray-200">
          {HOURS.map(hour => (
            <div key={hour} className="grid grid-cols-8 min-h-[100px]">
              <div className="p-2 text-sm border-r border-gray-200 sticky left-0 bg-white z-10 text-center">
                {hour % 12 || 12}:00 {hour >= 12 ? 'PM' : 'AM'}
              </div>
              
              {DAYS.map(day => (
                <div key={`${day}-${hour}`} className="border-r border-gray-200 p-1 relative">
                  {scheduleMap[day][`${hour}:00`].map((schedule, index) => (
                    <div 
                      key={`${schedule.id}-${index}`}
                      className={`p-2 rounded-md text-xs mb-1 ${getCourseColor(schedule.courseId)}`}
                    >
                      <div className="font-medium truncate">{schedule.courseName}</div>
                      <div className="text-xs mt-1 opacity-80">
                        {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                      </div>
                      <div className="text-xs mt-1 opacity-80 flex justify-between">
                        <span>{schedule.roomName}</span>
                        <span>{calculateDuration(schedule.startTime, schedule.endTime)}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
