"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus } from "lucide-react";

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: {
    name: string;
  };
}

interface SchedulesListProps {
  courseId: string;
  schedules: Schedule[];
}

export default function SchedulesList({ courseId, schedules }: SchedulesListProps) {
  const router = useRouter();

  // Helper function to format time
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
    } catch (error) {
      return time;
    }
  };

  // Sort schedules by day of week and start time
  const sortedSchedules = [...schedules].sort((a, b) => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const dayA = days.indexOf(a.dayOfWeek);
    const dayB = days.indexOf(b.dayOfWeek);
    
    if (dayA !== dayB) return dayA - dayB;
    
    return a.startTime.localeCompare(b.startTime);
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-medium text-gray-900">Class Schedule</h3>
        <Button onClick={() => router.push(`/admin/courses/${courseId}/schedule/create`)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule
        </Button>
      </div>

      {sortedSchedules.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No schedules have been added for this course yet.</p>
          <Button 
            variant="link" 
            onClick={() => router.push(`/admin/courses/${courseId}/schedule/create`)}
          >
            Add your first schedule
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSchedules.map((schedule) => (
                <TableRow key={schedule.id}>
                  <TableCell className="font-medium">{schedule.dayOfWeek}</TableCell>
                  <TableCell>
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </TableCell>
                  <TableCell>{schedule.room?.name || 'TBD'}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => router.push(`/admin/courses/${courseId}/schedule/${schedule.id}/edit`)}>
                          Edit Schedule
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => {
                          // Handle schedule deletion
                        }}>
                          Delete Schedule
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}