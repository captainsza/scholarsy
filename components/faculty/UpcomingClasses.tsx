"use client";

import React from "react";
import { format, parseISO } from 'date-fns';

type Class = {
  id: string;
  courseName: string;
  roomName: string;
  startTime: string;
  endTime: string;
  dayOfWeek: string;
};

type UpcomingClassesProps = {
  classes: Class[];
};

export default function UpcomingClasses({ classes }: UpcomingClassesProps) {
  if (classes.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        No upcoming classes scheduled.
      </div>
    );
  }

  // Helper function to format time
  const formatTime = (timeString: string) => {
    try {
      const date = parseISO(timeString);
      return format(date, 'h:mm a');
    } catch (error) {
      return timeString;
    }
  };

  return (
    <div className="space-y-4">
      {classes.map((classItem) => (
        <div key={classItem.id} className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">{classItem.courseName}</h3>
              <p className="text-xs text-gray-500">{classItem.roomName}</p>
            </div>
            <div className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full">
              {classItem.dayOfWeek}
            </div>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            {formatTime(classItem.startTime)} - {formatTime(classItem.endTime)}
          </div>
        </div>
      ))}
    </div>
  );
}
