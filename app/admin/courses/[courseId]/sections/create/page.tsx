
"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Update the type to use courseId instead of id
interface SectionCreatePageProps {
  params: {
    courseId: string;  // Changed from 'id' to 'courseId'
  }
}

interface CourseData {
  id: string;
  name: string;
  code: string;
}

interface SectionFormData {
  name: string;
  academicTerm: string;
  capacity: number;
}

export default function CreateSectionPage({ params }: SectionCreatePageProps) {
  const router = useRouter();
  const courseId = params.courseId;  // Changed from params.id to params.courseId
  const [loading, setLoading] = useState<boolean>(false);
  const [courseLoading, setCourseLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [course, setCourse] = useState<CourseData | null>(null);
  const [formData, setFormData] = useState<SectionFormData>({
    name: "",
    academicTerm: "",
    capacity: 30,
  });

  // Fetch course details
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setCourseLoading(true);
        const response = await fetch(`/api/admin/courses/${courseId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch course details");
        }
        const data = await response.json();
        setCourse(data.course);
      } catch (err) {
        setError("Failed to load course details");
        console.error(err);
      } finally {
        setCourseLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacity" ? parseInt(value) : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/courses/${courseId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create section");
      }

      // Redirect to subject creation page
      router.push(`/admin/courses/${courseId}/sections/${data.section.id}/subjects/create`);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (courseLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading course details..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create Course Section</h1>
            <p className="mt-1 text-sm text-gray-500">
              Create a new section for course: {course?.name} ({course?.code})
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Section Information</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                      Section Name
                    </label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Section A"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="academicTerm" className="block text-sm font-medium text-gray-700">
                      Academic Term
                    </label>
                    <Input
                      id="academicTerm"
                      name="academicTerm"
                      value={formData.academicTerm}
                      onChange={handleChange}
                      required
                      placeholder="e.g., Fall 2023"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                      Capacity
                    </label>
                    <Input
                      id="capacity"
                      name="capacity"
                      type="number"
                      min="1"
                      value={formData.capacity}
                      onChange={handleChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Section"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
