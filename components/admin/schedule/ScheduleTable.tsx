"use client";

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toastall';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ScheduleItem {
  id: string;
  courseId: string;
  courseName: string;
  subjectName: string;
  subjectCode: string;
  facultyName: string;
  roomName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}

interface ScheduleTableProps {
  filter?: {
    courseId?: string;
    dayOfWeek?: string;
    roomId?: string;
  };
}

export default function ScheduleTable({ filter = {} }: ScheduleTableProps) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteScheduleId, setDeleteScheduleId] = useState<string | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [filter]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query string based on filters
      const queryParams = new URLSearchParams();
      if (filter.courseId) queryParams.append('courseId', filter.courseId);
      if (filter.dayOfWeek) queryParams.append('dayOfWeek', filter.dayOfWeek);
      if (filter.roomId) queryParams.append('roomId', filter.roomId);
      
      const url = `/api/admin/schedule${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        throw new Error('Failed to fetch schedules');
      }
      
      const data = await res.json();
      setSchedules(data.schedules);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules. Please try again.');
      toast({
        title: 'Error',
        description: err.message || 'Failed to load schedules',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteScheduleId) return;
    
    try {
      const res = await fetch(`/api/admin/schedule/${deleteScheduleId}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        throw new Error('Failed to delete schedule');
      }
      
      setSchedules(schedules.filter(s => s.id !== deleteScheduleId));
      toast({
        title: 'Success',
        description: 'Schedule deleted successfully',
      });
    } catch (err: any) {
      console.error('Error deleting schedule:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to delete schedule',
        variant: 'destructive',
      });
    } finally {
      setConfirmingDelete(false);
      setDeleteScheduleId(null);
    }
  };

  const formatTime = (time: string) => {
    // Format 24h time to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    return `${hour % 12 || 12}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  const getDayColor = (day: string) => {
    // Return different background colors for days of the week
    const colors: Record<string, string> = {
      'Monday': 'bg-blue-50',
      'Tuesday': 'bg-green-50',
      'Wednesday': 'bg-yellow-50',
      'Thursday': 'bg-purple-50',
      'Friday': 'bg-pink-50',
      'Saturday': 'bg-orange-50',
      'Sunday': 'bg-gray-50',
    };
    return colors[day] || 'bg-gray-50';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchSchedules}>Try Again</Button>
      </div>
    );
  }

  if (!schedules.length) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-md">
        <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-3" />
        <h3 className="text-lg font-medium text-gray-900">No schedules found</h3>
        <p className="text-gray-500 mt-2">No class schedules match your criteria</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Day</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Course</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead>Room</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schedules.map((schedule) => (
              <TableRow key={schedule.id} className={getDayColor(schedule.dayOfWeek)}>
                <TableCell className="font-medium">{schedule.dayOfWeek}</TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Clock className="h-3 w-3 mr-1 text-gray-500" />
                    {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                  </div>
                </TableCell>
                <TableCell>{schedule.courseName}</TableCell>
                <TableCell>
                  <div>
                    <div>{schedule.subjectName}</div>
                    <div className="text-xs text-gray-500">{schedule.subjectCode}</div>
                  </div>
                </TableCell>
                <TableCell>{schedule.facultyName}</TableCell>
                <TableCell>
                  {schedule.roomName || (
                    <span className="text-gray-400 italic text-sm">Not assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/schedule/edit/${schedule.id}`)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setDeleteScheduleId(schedule.id);
                          setConfirmingDelete(true);
                        }}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmingDelete} onOpenChange={setConfirmingDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Schedule</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmingDelete(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
