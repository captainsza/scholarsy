"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Plus, Search } from "lucide-react";

interface Course {
  id: string;
  name: string;
  branch: string;
  year: string;
  semester: string;
  credits?: number;
  subjectsCount?: number; // New field to show number of subjects
  faculty?: {
    user: {
      profile: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

interface CourseListProps {
  courses: Course[];
  loading: boolean;
}

export default function CourseList({ courses, loading }: CourseListProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter courses based on search query
  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.branch.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
      </div>
    );
  }

  if (courses.length === 0) {
    return (
      <div className="text-center py-10">
        <h3 className="mt-2 text-sm font-medium text-gray-900">No courses found</h3>
        <p className="mt-1 text-sm text-gray-500">Get started by creating a new course.</p>
        <div className="mt-6">
          <Button onClick={() => router.push("/admin/courses/create")}>
            <Plus className="h-4 w-4 mr-2" />
            New Course
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search courses..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
   
      </div>

      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Subjects</TableHead>
                <TableHead>Course Coordinator</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/courses/${course.id}`} className="text-blue-600 hover:underline">
                      {course.name}
                    </Link>
                  </TableCell>
                  <TableCell>{course.branch}</TableCell>
                  <TableCell>{`${course.year}${getOrdinalSuffix(parseInt(course.year))}`} Year</TableCell>
                  <TableCell>{`Semester ${course.semester}`}</TableCell>
                  <TableCell>{course.credits || "N/A"}</TableCell>
                  <TableCell>{course.subjectsCount || 0}</TableCell>
                  <TableCell>
                    {course.faculty
                      ? `${course.faculty.user.profile.firstName} ${course.faculty.user.profile.lastName}`
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
                        <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}`)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}/edit`)}>
                          Edit Course
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}/subjects/create`)}>
                          Add Subject
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => router.push(`/admin/courses/${course.id}/enroll`)}>
                          Enroll Students
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

// Helper function to get ordinal suffix
function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;
  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}
