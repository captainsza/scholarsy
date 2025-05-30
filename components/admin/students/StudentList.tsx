"use client";

import { useState } from "react";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  GraduationCap,
  UserPlus,
  Clock
} from "lucide-react";
import { formatDistance } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface Student {
  id: string;
  enrollmentId: string;
  department: string;
  user: {
    id: string;
    createdAt: string;
    emailVerified: boolean;
    profile: {
      firstName: string;
      lastName: string;
      profileImage?: string;
    }
  };
  // Optional properties
  academicStatus?: string;
  currentSemester?: string;
  branchName?: string;
}

interface StudentListProps {
  students: Student[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function StudentList({ students, onView, onEdit, onDelete }: StudentListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(students.length / pageSize);
  const paginatedStudents = students.slice((page - 1) * pageSize, page * pageSize);

  // Function to get status badge color
  const getStatusBadge = (status?: string) => {
    if (!status) return { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Unknown' };
    
    switch(status.toUpperCase()) {
      case 'ACTIVE':
        return { bg: 'bg-green-100', text: 'text-green-800', label: 'Active' };
      case 'INACTIVE':
        return { bg: 'bg-red-100', text: 'text-red-800', label: 'Inactive' };
      case 'SUSPENDED':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Suspended' };
      case 'GRADUATED':
        return { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Graduated' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-800', label: status };
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 w-[300px]">Student</TableHead>
            <TableHead>Enrollment ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedStudents.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                No students found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedStudents.map((student) => {
              const status = getStatusBadge(student.academicStatus);
              return (
                <TableRow key={student.id}>
                  <TableCell className="pl-4 font-medium flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={student.user.profile?.profileImage} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {student.user.profile?.firstName?.[0]}
                        {student.user.profile?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {student.user.profile?.firstName} {student.user.profile?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {student.currentSemester ? `Semester ${student.currentSemester}` : 'N/A'}
                        {student.branchName ? ` • ${student.branchName}` : ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{student.enrollmentId}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${status.bg} ${status.text} border-0`}>
                      {status.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {student.user.createdAt 
                      ? formatDistance(new Date(student.user.createdAt), new Date(), { addSuffix: true }) 
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(student.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(student.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit student</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView(`${student.id}/enroll`)}>
                          <UserPlus className="mr-2 h-4 w-4" />
                          <span>Manage enrollments</span>
                        </DropdownMenuItem>

                     
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(student.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>Delete student</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4 px-6 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            Previous
          </Button>
          <div className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
