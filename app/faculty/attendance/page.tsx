"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import AttendanceTable from "@/components/faculty/AttendanceTable";

type Course = {
  id: string;
  code: string;
  name: string;
};

export default function AttendancePage() {
  const { user, loading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/faculty/courses");
        if (response.ok) {
          const data = await response.json();
          setCourses(data.courses);
          if (data.courses.length > 0) {
            setSelectedCourse(data.courses[0].id);
          }
        } else {
          console.error("Failed to fetch courses");
        }
      } catch (error) {
        console.error("Error fetching courses:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading && user) {
      fetchCourses();
    }
  }, [authLoading, user]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const handleCourseChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCourse(e.target.value);
  };

  return (
    <FacultyLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Attendance Management</h1>

        <div className="bg-white rounded-lg shadow mb-6">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Mark Attendance</h2>
            <p className="mt-1 text-sm text-gray-500">
              Select a course and date to manage student attendance
            </p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="course" className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  id="course"
                  name="course"
                  value={selectedCourse}
                  onChange={handleCourseChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                  disabled={loading || courses.length === 0}
                >
                  {courses.length === 0 ? (
                    <option>No courses available</option>
                  ) : (
                    courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code}: {course.name}
                      </option>
                    ))
                  )}
                </select>
              </div>
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {selectedCourse && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Student Attendance</h2>
              <p className="mt-1 text-sm text-gray-500">
                Mark, view and update attendance records
              </p>
            </div>
            <AttendanceTable 
              courseId={selectedCourse} 
              date={selectedDate} 
            />
          </div>
        )}
      </div>
    </FacultyLayout>
  );
}
