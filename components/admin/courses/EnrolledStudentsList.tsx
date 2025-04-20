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
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Search, UserPlus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Enrollment {
  id: string;
  status: string;
  student: {
    id: string;
    enrollmentId: string;
    user: {
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

interface EnrolledStudentsListProps {
  courseId: string;
  enrollments: Enrollment[];
}

export default function EnrolledStudentsList({ courseId, enrollments }: EnrolledStudentsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter enrollments based on search query
  const filteredEnrollments = enrollments.filter(
    (enrollment) =>
      enrollment.student.enrollmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.student.user.profile.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      enrollment.student.user.profile.lastName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Status badge component for consistent styling
  const StatusBadge = ({ status }: { status: string }) => {
    let color = "bg-gray-100 text-gray-800";
    
    switch (status) {
      case "ACTIVE":
        color = "bg-green-100 text-green-800";
        break;
      case "DROPPED":
        color = "bg-red-100 text-red-800";
        break;
      case "COMPLETED":
        color = "bg-blue-100 text-blue-800";
        break;
      case "ON_HOLD":
        color = "bg-yellow-100 text-yellow-800";
        break;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search students..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push(`/admin/courses/${courseId}/enroll`)}>
          <UserPlus className="h-4 w-4 mr-2" />
          Enroll Students
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Enrollment ID</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEnrollments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-gray-500">
                  {searchQuery ? (
                    <div>
                      <p>No students matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div>
                      <p>No students enrolled in this course yet</p>
                      <Button 
                        variant="link" 
                        onClick={() => router.push(`/admin/courses/${courseId}/enroll`)}
                      >
                        Enroll students now
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredEnrollments.map((enrollment) => (
                <TableRow key={enrollment.id}>
                  <TableCell className="font-medium">
                    {enrollment.student.enrollmentId}
                  </TableCell>
                  <TableCell>
                    {enrollment.student.user.profile.firstName} {enrollment.student.user.profile.lastName}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={enrollment.status} />
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
                        <DropdownMenuItem onClick={() => router.push(`/admin/students/${enrollment.student.id}`)}>
                          View Student Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/enrollments/${enrollment.id}/status`)}>
                          Change Status
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
