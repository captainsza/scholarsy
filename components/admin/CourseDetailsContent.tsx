"use client";

import { formatDistance } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface CourseDetailsContentProps {
  course: any;
}

export default function CourseDetailsContent({ course }: CourseDetailsContentProps) {
  // Get the faculty coordinator details if available
  const facultyCoordinator = course.faculty;
  
  // Calculate summary statistics
  const totalSubjects = course._count?.subjects || 0;
  const totalStudents = course._count?.students || 0;
  
  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Course Information */}
        <div className="md:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Course Information</h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">Course Name</h4>
                <p className="mt-1 text-sm text-gray-900">{course.name}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Branch</h4>
                <p className="mt-1 text-sm text-gray-900">{course.branch}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Year</h4>
                <p className="mt-1 text-sm text-gray-900">{course.year}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Semester</h4>
                <p className="mt-1 text-sm text-gray-900">{course.semester}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Credits</h4>
                <p className="mt-1 text-sm text-gray-900">{course.credits || "N/A"}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Course ID</h4>
                <p className="mt-1 text-sm text-gray-900">{course.id}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {course.description && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-sm text-gray-600 whitespace-pre-line">
                {course.description}
              </p>
            </div>
          )}
          
          {/* Subjects List (Preview) */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Subjects</h3>
            {course.subjects && course.subjects.length > 0 ? (
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="space-y-2">
                  {course.subjects.slice(0, 5).map((subject: any) => (
                    <li key={subject.id} className="text-sm text-gray-600">
                      <span className="font-medium text-gray-800">{subject.code}</span>: {subject.name}
                    </li>
                  ))}
                  {course.subjects.length > 5 && (
                    <li className="text-sm text-blue-600">
                      +{course.subjects.length - 5} more subjects...
                    </li>
                  )}
                </ul>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No subjects added to this course yet.</p>
            )}
          </div>
        </div>
        
        {/* Sidebar with Summary Information */}
        <div className="space-y-6">
          {/* Faculty Coordinator */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Course Coordinator</h3>
            {facultyCoordinator ? (
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={facultyCoordinator.user.profile?.profileImage || ""} />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {facultyCoordinator.user.profile?.firstName?.[0]}
                    {facultyCoordinator.user.profile?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {facultyCoordinator.user.profile?.firstName} {facultyCoordinator.user.profile?.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{facultyCoordinator.department}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No coordinator assigned</p>
            )}
          </div>
          
          {/* Statistics */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Course Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Subjects:</span>
                <span className="text-sm font-medium text-gray-900">{totalSubjects}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Students:</span>
                <span className="text-sm font-medium text-gray-900">{totalStudents}</span>
              </div>
            </div>
          </div>
          
          {/* Course Timeline */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Timeline</h3>
            <div className="space-y-3 text-sm">
              {course.createdAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">
                    {formatDistance(new Date(course.createdAt), new Date(), { addSuffix: true })}
                  </span>
                </div>
              )}
              {course.updatedAt && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="text-gray-900">
                    {formatDistance(new Date(course.updatedAt), new Date(), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
