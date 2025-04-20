"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  BookOpen, 
  MoreHorizontal, 
  Check, 
  X, 
  Clock, 
  AlertTriangle
} from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDistance } from "date-fns";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

interface Enrollment {
  id: string;
  status: string;
  enrolledAt: string;
  course: {
    id: string;
    name: string;
    branch: string;
    semester: string;
    year: string;
  };
}

interface StudentEnrollmentsProps {
  enrollments: Enrollment[];
  studentId: string;
}

export default function StudentEnrollments({ enrollments = [], studentId }: StudentEnrollmentsProps) {
  const router = useRouter();
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<{
    id: string;
    action: 'activate' | 'drop' | 'complete' | 'hold';
  } | null>(null);

  const getStatusBadge = (status: string) => {
    const statuses: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
      ACTIVE: { 
        color: "bg-green-100 text-green-800 border-0", 
        label: "Active",
        icon: <Check className="h-3 w-3 mr-1" />
      },
      DROPPED: { 
        color: "bg-red-100 text-red-800 border-0", 
        label: "Dropped",
        icon: <X className="h-3 w-3 mr-1" />
      },
      COMPLETED: { 
        color: "bg-blue-100 text-blue-800 border-0", 
        label: "Completed",
        icon: <BookOpen className="h-3 w-3 mr-1" />
      },
      ON_HOLD: { 
        color: "bg-yellow-100 text-yellow-800 border-0", 
        label: "On Hold",
        icon: <Clock className="h-3 w-3 mr-1" />
      }
    };

    const statusInfo = statuses[status] || {
      color: "bg-gray-100 text-gray-800 border-0",
      label: status,
      icon: null
    };

    return (
      <Badge className={statusInfo.color}>
        <span className="flex items-center">
          {statusInfo.icon}
          {statusInfo.label}
        </span>
      </Badge>
    );
  };

  const handleStatusChange = async () => {
    if (!selectedEnrollment) return;

    try {
      setLoading(true);
      const { id, action } = selectedEnrollment;
      
      const statusMap = {
        activate: 'ACTIVE',
        drop: 'DROPPED',
        complete: 'COMPLETED',
        hold: 'ON_HOLD'
      };

      const response = await fetch(`/api/admin/enrollments/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: statusMap[action]
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update enrollment status');
      }

      // Update the UI locally to avoid a refetch
      const updatedEnrollments = enrollments.map(enrollment => {
        if (enrollment.id === id) {
          return {
            ...enrollment,
            status: statusMap[action]
          };
        }
        return enrollment;
      });

      // You'd typically use setEnrollments here, but since we're using props,
      // we'll need to refresh the page or use a state management solution
      router.refresh();

      toast({
        title: "Success",
        description: `Enrollment status updated to ${statusMap[action].toLowerCase()}`,
      });
    } catch (error) {
      console.error('Error updating enrollment status:', error);
      toast({
        title: "Error",
        description: "Failed to update enrollment status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsConfirmDialogOpen(false);
      setSelectedEnrollment(null);
    }
  };

  const openStatusDialog = (enrollmentId: string, action: 'activate' | 'drop' | 'complete' | 'hold') => {
    setSelectedEnrollment({ id: enrollmentId, action });
    setIsConfirmDialogOpen(true);
  };

  const getActionMessage = () => {
    if (!selectedEnrollment) return "";
    
    const actions = {
      activate: "activate this enrollment",
      drop: "mark this enrollment as dropped",
      complete: "mark this enrollment as completed",
      hold: "put this enrollment on hold"
    };
    
    return actions[selectedEnrollment.action];
  };

  if (enrollments.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-md">
        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
        <p className="mt-1 text-sm text-gray-500">
          This student isn't enrolled in any courses yet.
        </p>
        <div className="mt-6">
          <Button
            onClick={() => router.push(`/admin/students/${studentId}/enroll`)}
          >
            Enroll Student in Courses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-md border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Course</TableHead>
              <TableHead>Semester</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrollments.map((enrollment) => (
              <TableRow key={enrollment.id}>
                <TableCell className="font-medium">
                  <div className="font-medium">{enrollment.course.name}</div>
                  <div className="text-sm text-gray-500">{enrollment.course.branch}</div>
                </TableCell>
                <TableCell>
                  {enrollment.course.year} • {enrollment.course.semester}
                </TableCell>
                <TableCell>
                  {getStatusBadge(enrollment.status)}
                </TableCell>
                <TableCell>
                  {formatDistance(new Date(enrollment.enrolledAt), new Date(), { addSuffix: true })}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => router.push(`/admin/courses/${enrollment.course.id}`)}>
                        <BookOpen className="mr-2 h-4 w-4" />
                        View course details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      {enrollment.status !== 'ACTIVE' && (
                        <DropdownMenuItem onClick={() => openStatusDialog(enrollment.id, 'activate')}>
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                          Activate enrollment
                        </DropdownMenuItem>
                      )}
                      {enrollment.status !== 'COMPLETED' && (
                        <DropdownMenuItem onClick={() => openStatusDialog(enrollment.id, 'complete')}>
                          <BookOpen className="mr-2 h-4 w-4 text-blue-600" />
                          Mark as completed
                        </DropdownMenuItem>
                      )}
                      {enrollment.status !== 'ON_HOLD' && (
                        <DropdownMenuItem onClick={() => openStatusDialog(enrollment.id, 'hold')}>
                          <Clock className="mr-2 h-4 w-4 text-yellow-600" />
                          Put on hold
                        </DropdownMenuItem>
                      )}
                      {enrollment.status !== 'DROPPED' && (
                        <DropdownMenuItem 
                          onClick={() => openStatusDialog(enrollment.id, 'drop')}
                          className="text-red-600"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Drop course
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Confirm Status Change Dialog */}
      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Status Change</DialogTitle>
            <DialogDescription>
              Are you sure you want to {getActionMessage()}?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center py-4">
            <div className="bg-amber-50 p-3 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsConfirmDialogOpen(false);
                setSelectedEnrollment(null);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleStatusChange}
              disabled={loading}
            >
              {loading ? <LoadingSpinner small /> : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
