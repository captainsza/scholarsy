"use client";

import { useState } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Edit, Trash, MoreHorizontal, Copy, Calendar, Clock } from "lucide-react";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toastall";
import { useRouter } from "next/navigation";

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

interface ScheduleTableProps {
  schedules: ScheduleItem[];
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

export default function ScheduleTable({ 
  schedules,
  onDelete,
  onEdit
}: ScheduleTableProps) {
  const router = useRouter();
  const [selectedSchedule, setSelectedSchedule] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Group schedules by day of week for better organization
  const schedulesByDay = schedules.reduce((acc, schedule) => {
    const day = schedule.dayOfWeek;
    if (!acc[day]) {
      acc[day] = [];
    }
    acc[day].push(schedule);
    return acc;
  }, {} as Record<string, ScheduleItem[]>);
  
  // Order days of the week
  const orderedDays = [
    "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
  ];
  
  // Format time to 12-hour format
  const formatTime = (time: string) => {
    try {
      const [hours, minutes] = time.split(':').map(Number);
      return `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;
    } catch (error) {
      return time;
    }
  };
  
  const handleEdit = (id: string) => {
    if (onEdit) {
      onEdit(id);
    } else {
      router.push(`/admin/schedule/${id}/edit`);
    }
  };
  
  const handleDelete = (id: string) => {
    setSelectedSchedule(id);
    setShowDeleteDialog(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedSchedule) return;
    
    if (onDelete) {
      onDelete(selectedSchedule);
      setShowDeleteDialog(false);
      setSelectedSchedule(null);
      return;
    }
    
    try {
      const response = await fetch(`/api/admin/schedule/${selectedSchedule}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Schedule deleted successfully",
        });
        router.refresh(); // Refresh the page to update the schedule list
      } else {
        throw new Error('Failed to delete schedule');
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
      toast({
        title: "Error",
        description: "Failed to delete schedule",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setSelectedSchedule(null);
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
  
  if (schedules.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 rounded-lg">
        <Calendar className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No schedules found</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating a new class schedule.
        </p>
        <div className="mt-6">
          <Button onClick={() => router.push('/admin/schedule/create')}>
            Create New Schedule
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {orderedDays.filter(day => schedulesByDay[day]).map(day => (
        <div key={day} className="mb-8">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            <Badge className={dayColorMap[day] || "bg-gray-100 text-gray-800"}>
              {day}
            </Badge>
          </h3>
          
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Time</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Room</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedulesByDay[day]
                  ?.sort((a, b) => a.startTime.localeCompare(b.startTime))
                  .map((schedule) => (
                    <TableRow key={schedule.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-gray-500" />
                          <span>{formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{schedule.courseName}</div>
                      </TableCell>
                      <TableCell>{schedule.roomName}</TableCell>
                      <TableCell>{schedule.facultyName}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/admin/schedule/${schedule.id}`)}>
                              <Calendar className="mr-2 h-4 w-4" />
                              <span>View Details</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(schedule.id)}>
                              <Edit className="mr-2 h-4 w-4" />
                              <span>Edit Schedule</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/admin/schedule/create?duplicate=${schedule.id}`)}>
                              <Copy className="mr-2 h-4 w-4" />
                              <span>Duplicate</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => handleDelete(schedule.id)}
                              className="text-red-600 focus:text-red-700 focus:bg-red-50"
                            >
                              <Trash className="mr-2 h-4 w-4" />
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
        </div>
      ))}
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this schedule? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
