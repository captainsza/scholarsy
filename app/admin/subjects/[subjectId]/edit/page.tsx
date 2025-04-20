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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { ArrowLeft } from "lucide-react";

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

export default function EditSubjectPage({ params }: { params: { subjectId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [originalCourseId, setOriginalCourseId] = useState<string>("");
  
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
        setLoading(true);
        
        // Fetch faculty list
        const facultyResponse = await fetch("/api/admin/faculty");
        if (facultyResponse.ok) {
          const data = await facultyResponse.json();
          setFacultyList(data.faculty || []);
        }

        // Fetch subject details
        const subjectResponse = await fetch(`/api/admin/subjects/${params.subjectId}`);
        if (subjectResponse.ok) {
          const data = await subjectResponse.json();
          const subject = data.subject;
          
          setFormData({
            name: subject.name,
            code: subject.code,
            description: subject.description || "",
            creditHours: subject.creditHours.toString(),
            facultyId: subject.facultyId || "none",
          });
          
          setOriginalCourseId(subject.courseId);
        } else {
          throw new Error("Failed to fetch subject details");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast({
          title: "Error",
          description: "Failed to load subject data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.subjectId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Convert credit hours to number
      const creditHours = parseInt(formData.creditHours, 10);

      const response = await fetch(`/api/admin/subjects/${params.subjectId}`, {
        method: "PUT",
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
          description: "Subject updated successfully",
        });
        router.push(`/admin/subjects/${params.subjectId}`);
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to update subject");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subject",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner message="Loading subject data..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Edit Subject</h1>
            <Button
              variant="outline"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

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
                <Button 
                  type="button" 
                  variant="outline" 
                  className="mr-2"
                  onClick={() => router.push(`/admin/subjects/${params.subjectId}`)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
