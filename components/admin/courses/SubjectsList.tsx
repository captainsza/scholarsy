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
import { MoreHorizontal, Plus, Search } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  creditHours: number;
  faculty?: {
    user: {
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

interface SubjectsListProps {
  courseId: string;
  subjects: Subject[];
}

export default function SubjectsList({ courseId, subjects }: SubjectsListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter subjects based on search query
  const filteredSubjects = subjects.filter(
    (subject) =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search subjects..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button onClick={() => router.push(`/admin/courses/${courseId}/subjects/create`)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Subject Name</TableHead>
              <TableHead>Credit Hours</TableHead>
              <TableHead>Faculty</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  {searchQuery ? (
                    <div>
                      <p>No subjects matching "{searchQuery}"</p>
                    </div>
                  ) : (
                    <div>
                      <p>No subjects have been added to this course yet</p>
                      <Button 
                        variant="link" 
                        onClick={() => router.push(`/admin/courses/${courseId}/subjects/create`)}
                      >
                        Add your first subject
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredSubjects.map((subject) => (
                <TableRow key={subject.id}>
                  <TableCell className="font-medium">{subject.code}</TableCell>
                  <TableCell>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-left justify-start"
                      onClick={() => router.push(`/admin/subjects/${subject.id}`)}
                    >
                      {subject.name}
                    </Button>
                  </TableCell>
                  <TableCell>{subject.creditHours || 'N/A'}</TableCell>
                  <TableCell>
                    {subject.faculty
                      ? `${subject.faculty.user.profile.firstName} ${subject.faculty.user.profile.lastName}`
                      : "Not assigned"}
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
                        <DropdownMenuItem onClick={() => router.push(`/admin/subjects/${subject.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/subjects/${subject.id}/edit`)}>
                          Edit Subject
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/subjects/${subject.id}/assign-faculty`)}>
                          Assign Faculty
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
