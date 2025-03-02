import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";

// Define proper types for course data
interface Course {
  id: string;
  code: string;
  name: string;
  department: string;
  credits: number;
  _count: {
    sections: number;
    registrations: number;
  }
}

interface CourseListProps {
  courses: Course[];
}

export default function CourseList({ courses }: CourseListProps) {
  const router = useRouter();
  const [sortField, setSortField] = useState<string>("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  
  const sortedCourses = [...courses].sort((a, b) => {
    let aValue: any = a[sortField as keyof Course];
    let bValue: any = b[sortField as keyof Course];
    
    // Handle special fields
    if (sortField === "sectionCount") {
      aValue = a._count.sections;
      bValue = b._count.sections;
    } else if (sortField === "studentCount") {
      aValue = a._count.registrations;
      bValue = b._count.registrations;
    }
    
    // Default sorting logic
    if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
    if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };
  
  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === "asc" ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("code")}
              >
                <div className="flex items-center">
                  Course Code
                  {getSortIcon("code")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("name")}
              >
                <div className="flex items-center">
                  Course Name
                  {getSortIcon("name")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("department")}
              >
                <div className="flex items-center">
                  Department
                  {getSortIcon("department")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("credits")}
              >
                <div className="flex items-center">
                  Credits
                  {getSortIcon("credits")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("sectionCount")}
              >
                <div className="flex items-center">
                  Sections
                  {getSortIcon("sectionCount")}
                </div>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => handleSort("studentCount")}
              >
                <div className="flex items-center">
                  Registrations
                  {getSortIcon("studentCount")}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedCourses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  No courses found. Create your first course!
                </TableCell>
              </TableRow>
            ) : (
              sortedCourses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell className="font-medium">{course.code}</TableCell>
                  <TableCell>{course.name}</TableCell>
                  <TableCell>{course.department}</TableCell>
                  <TableCell>{course.credits}</TableCell>
                  <TableCell>
                    <Badge variant={course._count.sections > 0 ? "default" : "outline"}>
                      {course._count.sections}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={course._count.registrations > 0 ? "default" : "outline"}>
                      {course._count.registrations}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => router.push(`/admin/courses/${course.id}`)}
                      >
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => router.push(`/admin/courses/${course.id}/edit`)}
                      >
                        Edit
                      </Button>
                    </div>
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
