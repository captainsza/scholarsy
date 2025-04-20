import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Clock, BookOpen, Users, CalendarDays } from "lucide-react";

interface CourseCardProps {
  course: {
    id: string;
    name: string;
    branch?: string; // Changed from code to branch to match schema
    description?: string;
    enrollmentStatus?: string;
    academicTerm?: string;
    teacher?: string;
    hoursPerWeek?: number;
    schedule?: {
      day: string;
      startTime: string;
      endTime: string;
      room: string;
    }[];
  };
}

// Fixed getStatusColor function with strong null checks
const getStatusColor = (enrollmentStatus: string | undefined) => {
  // Return default color if status is undefined or null
  if (!enrollmentStatus) return "bg-gray-100 text-gray-800";
  
  switch (enrollmentStatus.toUpperCase()) {
    case "ACTIVE":
      return "bg-green-100 text-green-800";
    case "COMPLETED":
      return "bg-blue-100 text-blue-800";
    case "DROPPED":
      return "bg-red-100 text-red-800";
    case "ON_HOLD":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function CourseCard({ course }: CourseCardProps) {
  // Add a safety check for the course object
  if (!course) {
    return null;
  }
  
  return (
    <Link href={`/student/courses/${course.id}`}>
      <Card className="h-full overflow-hidden hover:shadow-md transition-shadow duration-300 cursor-pointer">
        <CardContent className="p-6">
          <div className="flex flex-col h-full">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{course.name}</h3>
                {course.branch && <p className="text-sm text-gray-500">{course.branch}</p>}
                {course.academicTerm && (
                  <p className="text-xs text-gray-500 mt-1">{course.academicTerm}</p>
                )}
              </div>
              
              {/* Only render badge if enrollmentStatus exists */}
              {course.enrollmentStatus && (
                <Badge className={getStatusColor(course.enrollmentStatus)}>
                  {course.enrollmentStatus}
                </Badge>
              )}
            </div>
            
            {course.description && (
              <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
            )}
            
            <div className="mt-auto space-y-2">
              {course.teacher && (
                <div className="flex items-center text-xs text-gray-600">
                  <Users className="h-3.5 w-3.5 mr-2 text-gray-400" />
                  <span>{course.teacher}</span>
                </div>
              )}
              
              {course.hoursPerWeek && (
                <div className="flex items-center text-xs text-gray-600">
                  <Clock className="h-3.5 w-3.5 mr-2 text-gray-400" />
                  <span>{course.hoursPerWeek} hours per week</span>
                </div>
              )}
              
              {course.schedule && course.schedule.length > 0 && (
                <div className="flex items-center text-xs text-gray-600">
                  <CalendarDays className="h-3.5 w-3.5 mr-2 text-gray-400" />
                  <span>{course.schedule.length} scheduled classes</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
