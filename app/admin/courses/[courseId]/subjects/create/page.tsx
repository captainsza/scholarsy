"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/toastall";

interface Faculty {
  id: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
    };
  };
  department: string;
}

interface CourseDetails {
  id: string;
  name: string;
  branch: string;
  year: string;
  semester: string;
}

export default function CreateSubjectPage({ params }: { params: { courseId: string } }) {
  const router = useRouter();
  const courseId = params.courseId;
  const [loading, setLoading] = useState(false);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [courseDetails, setCourseDetails] = useState<CourseDetails | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
    creditHours: "3",
    facultyId: "none",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch faculty list
        const facultyResponse = await fetch("/api/admin/faculty");
        if (facultyResponse.ok) {
          const data = await facultyResponse.json();
          setFacultyList(data.faculty || []);
        }

        // Fetch course details
        const courseResponse = await fetch(`/api/admin/courses/${courseId}`);
        if (courseResponse.ok) {
          const data = await courseResponse.json();
          setCourseDetails(data.course);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load required data",
          variant: "destructive",
        });
      }
    };

    fetchData();
  }, [courseId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Convert credit hours to number
      const creditHours = parseInt(formData.creditHours, 10);

      const response = await fetch(`/api/admin/courses/${courseId}/subjects/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          creditHours,
          facultyId: formData.facultyId === "none" ? null : formData.facultyId,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Subject created successfully",
        });
        router.push(`/admin/courses/${courseId}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create subject");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create subject",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Add Subject to Course</h1>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>

          {courseDetails && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h2 className="text-lg font-medium text-gray-900">Course: {courseDetails.name}</h2>
              <p className="text-sm text-gray-600">
                {courseDetails.branch} • Year {courseDetails.year} • Semester {courseDetails.semester}
              </p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Subject Name<span className="text-red-500">*</span></Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">Subject Code<span className="text-red-500">*</span></Label>
                  <Input
                    id="code"
                    name="code"
                    value={formData.code}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="creditHours">Credit Hours</Label>
                  <Input
                    id="creditHours"
                    name="creditHours"
                    type="number"
                    value={formData.creditHours}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facultyId">Assign Faculty</Label>
                  <Select
                    value={formData.facultyId}
                    onValueChange={(value) => handleSelectChange("facultyId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {facultyList.map((faculty) => (
                        <SelectItem key={faculty.id} value={faculty.id}>
                          {`${faculty.user.profile.firstName} ${faculty.user.profile.lastName} (${faculty.department})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Subject"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
