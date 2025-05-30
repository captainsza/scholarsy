"use client";

import { Calendar } from "lucide-react";
import { useMemo } from "react";

interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  subjectName: string;
  subjectCode: string;
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
  console.log('ScheduleCalendar received schedules:', schedules); // Debug log
  
  // Group schedules by day and calculate their position
  const schedulesByDay = useMemo(() => {
    const map: Record<string, ScheduleItem[]> = {};
    
    // Initialize the map with all days
    DAYS.forEach(day => {
      map[day] = [];
    });
    
    // Group schedules by day
    schedules.forEach(schedule => {
      if (map[schedule.dayOfWeek]) {
        map[schedule.dayOfWeek].push(schedule);
      }
    });
    
    // Sort schedules within each day by start time
    Object.keys(map).forEach(day => {
      map[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
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
      "bg-blue-100 text-blue-800 border-blue-200",
      "bg-green-100 text-green-800 border-green-200",
      "bg-purple-100 text-purple-800 border-purple-200",
      "bg-amber-100 text-amber-800 border-amber-200",
      "bg-pink-100 text-pink-800 border-pink-200",
      "bg-indigo-100 text-indigo-800 border-indigo-200",
      "bg-cyan-100 text-cyan-800 border-cyan-200",
      "bg-emerald-100 text-emerald-800 border-emerald-200",
      "bg-violet-100 text-violet-800 border-violet-200",
      "bg-rose-100 text-rose-800 border-rose-200",
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
  
  // Calculate duration in hours
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
  
  // Calculate the row position and height for a schedule item
  const getSchedulePosition = (schedule: ScheduleItem) => {
    try {
      const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
      const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
      
      // Calculate start position (8 AM = row 0)
      const startRow = startHour - 8;
      const startOffset = (startMinute / 60) * 100; // Percentage within the hour
      
      // Calculate duration in hours
      const duration = ((endHour * 60 + endMinute) - (startHour * 60 + startMinute)) / 60;
      const height = duration * 100; // 100px per hour
      
      return {
        top: `${startRow * 100 + startOffset}px`,
        height: `${height}px`,
        minHeight: '60px' // Minimum height for readability
      };
    } catch (error) {
      return {
        top: '0px',
        height: '60px',
        minHeight: '60px'
      };
    }
  };
  
  if (schedules.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No class schedules are currently available to display. Try adjusting your filters or create a new schedule.
        </p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[1000px]">
        {/* Calendar Header */}
        <div className="grid grid-cols-8 bg-gray-50 rounded-t-md border-b">
          <div className="p-3 text-center font-medium border-r border-gray-200 sticky left-0 bg-gray-50 z-10">
            <span className="text-sm font-semibold text-gray-700">Time</span>
          </div>
          {DAYS.map(day => (
            <div key={day} className="p-3 text-center font-medium border-r border-gray-200">
              <span className="text-sm font-semibold text-gray-700">{day}</span>
              <div className="text-xs text-gray-500 mt-1">
                {schedulesByDay[day].length} classes
              </div>
            </div>
          ))}
        </div>
        
        {/* Calendar Body */}
        <div className="relative">
          {/* Time slots grid */}
          <div className="divide-y divide-gray-200">
            {HOURS.map(hour => (
              <div key={hour} className="grid grid-cols-8 h-[100px]">
                <div className="p-2 text-sm border-r border-gray-200 sticky left-0 bg-white z-10 flex items-start justify-center">
                  <span className="text-gray-600 font-medium">
                    {hour % 12 || 12}:00 {hour >= 12 ? 'PM' : 'AM'}
                  </span>
                </div>
                
                {DAYS.map(day => (
                  <div key={`${day}-${hour}`} className="border-r border-gray-200 relative bg-gray-50/30">
                    {/* This cell will be used for absolute positioning */}
                  </div>
                ))}
              </div>
            ))}
          </div>
          
          {/* Floating schedule items */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="grid grid-cols-8 h-full">
              <div className="sticky left-0 bg-transparent z-10"></div>
              {DAYS.map((day, dayIndex) => (
                <div key={day} className="relative border-r border-gray-200">
                  {schedulesByDay[day].map((schedule, index) => {
                    const position = getSchedulePosition(schedule);
                    return (
                      <div 
                        key={`${schedule.id}-${index}`}
                        className={`absolute left-1 right-1 rounded-md border-l-4 p-2 shadow-sm pointer-events-auto cursor-pointer hover:shadow-md transition-shadow ${getCourseColor(schedule.courseId)}`}
                        style={{
                          top: position.top,
                          height: position.height,
                          minHeight: position.minHeight,
                          zIndex: 20
                        }}
                        title={`${schedule.courseName} - ${schedule.subjectName} (${schedule.subjectCode})`}
                      >
                        <div className="text-xs font-semibold truncate mb-1">
                          {schedule.subjectCode}
                        </div>
                        <div className="text-xs truncate mb-1">
                          {schedule.subjectName}
                        </div>
                        <div className="text-xs opacity-80 flex items-center justify-between">
                          <span>{formatTime(schedule.startTime)}</span>
                          <span>{calculateDuration(schedule.startTime, schedule.endTime)}h</span>
                        </div>
                        <div className="text-xs opacity-80 truncate">
                          {schedule.roomName || 'No room'}
                        </div>
                        {schedule.facultyName && (
                          <div className="text-xs opacity-70 truncate">
                            {schedule.facultyName}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Footer with summary */}
        <div className="bg-gray-50 p-3 rounded-b-md border-t">
          <div className="text-sm text-gray-600 text-center">
            Total: <span className="font-semibold">{schedules.length}</span> scheduled classes
          </div>
        </div>
      </div>
    </div>
  );
}
