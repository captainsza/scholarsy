"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import CourseList from "@/components/admin/courses/CourseList";
import { Button } from "@/components/ui/button";

import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { DownloadIcon, FilterIcon, PlusIcon } from "lucide-react";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/courses");
        if (!response.ok) throw new Error("Failed to fetch courses");
        
        const data = await response.json();
        setCourses(data.courses);
      } catch (err) {
        setError("Failed to load courses. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6 sm:flex sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
          <div className="mt-3 sm:mt-0 sm:ml-4 flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {}}
              className="inline-flex items-center"
            >
              <FilterIcon className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button
              variant="outline"
              onClick={() => {}}
              className="inline-flex items-center"
            >
              <DownloadIcon className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              onClick={() => router.push("/admin/courses/create")}
              className="inline-flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Course
            </Button>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading courses..." />
        ) : error ? (
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        ) : (
          <CourseList courses={courses} />
        )}
      </div>
    </AdminLayout>
  );
}
