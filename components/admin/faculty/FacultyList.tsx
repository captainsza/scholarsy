"use client";

import { useState } from "react";
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  BookOpen,
  Calendar,
  ClipboardList
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

interface FacultyMember {
  id: string;
  department: string;
  user: {
    id: string;
    createdAt: string;
    emailVerified: boolean;
    profile: {
      firstName: string;
      lastName: string;
      profileImage?: string;
      phone?: string;
    }
  };
  courses?: any[];
  subjects?: any[];
}

interface FacultyListProps {
  faculty: FacultyMember[];
  onView: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  deleteLoading?: string | null;
}

export default function FacultyList({ 
  faculty, 
  onView, 
  onEdit, 
  onDelete, 
  deleteLoading 
}: FacultyListProps) {
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // Calculate pagination
  const totalPages = Math.ceil(faculty.length / pageSize);
  const paginatedFaculty = faculty.slice((page - 1) * pageSize, page * pageSize);

  // Count assigned subjects and courses
  const getAssignmentCounts = (member: FacultyMember) => {
    const subjectCount = member.subjects?.length || 0;
    const courseCount = member.courses?.length || 0;
    
    return { subjectCount, courseCount };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4 w-[300px]">Faculty Member</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Teaching Load</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="text-right pr-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {paginatedFaculty.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center">
                No faculty members found.
              </TableCell>
            </TableRow>
          ) : (
            paginatedFaculty.map((member) => {
              const { subjectCount, courseCount } = getAssignmentCounts(member);
              const isDeleting = deleteLoading === member.id;
              
              return (
                <TableRow key={member.id}>
                  <TableCell className="pl-4 font-medium flex items-center gap-3">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={member.user.profile?.profileImage} />
                      <AvatarFallback className="bg-cyan-100 text-cyan-600">
                        {member.user.profile?.firstName?.[0]}
                        {member.user.profile?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {member.user.profile?.firstName} {member.user.profile?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.user.profile?.phone || 'No contact info'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-0 w-fit">
                        {subjectCount} Subjects
                      </Badge>
                      <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-0 w-fit">
                        {courseCount} Courses
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.user.createdAt 
                      ? formatDistance(new Date(member.user.createdAt), new Date(), { addSuffix: true }) 
                      : 'N/A'}
                  </TableCell>
                  <TableCell className="text-right pr-6">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={isDeleting}
                        >
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onView(member.id)}>
                          <Eye className="mr-2 h-4 w-4" />
                          <span>View details</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(member.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Edit faculty</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onView(`${member.id}/courses`)}>
                          <BookOpen className="mr-2 h-4 w-4" />
                          <span>View courses</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onView(`${member.id}/assign-subjects`)}>
                          <ClipboardList className="mr-2 h-4 w-4" />
                          <span>Assign subjects</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onView(`${member.id}/schedule`)}>
                          <Calendar className="mr-2 h-4 w-4" />
                          <span>View schedule</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => onDelete(member.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={isDeleting}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span>{isDeleting ? "Deleting..." : "Delete faculty"}</span>
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
