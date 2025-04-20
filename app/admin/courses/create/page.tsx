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
import { PlusCircle, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

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

interface SubjectFormData {
  name: string;
  code: string;
  description?: string;
  creditHours: string;
  facultyId?: string;
}

export default function CreateCoursePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [facultyList, setFacultyList] = useState<Faculty[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    branch: "",
    year: "",
    semester: "",
    credits: "",
    description: "",
    facultyId: "none",
  });

  const [subjects, setSubjects] = useState<SubjectFormData[]>([
    { name: "", code: "", description: "", creditHours: "3", facultyId: "none" },
  ]);

  useEffect(() => {
    const fetchFaculty = async () => {
      try {
        const response = await fetch("/api/admin/faculty");
        if (response.ok) {
          const data = await response.json();
          setFacultyList(data.faculty || []);
        }
      } catch (error) {
        console.error("Error fetching faculty:", error);
      }
    };

    fetchFaculty();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubjectChange = (index: number, field: keyof SubjectFormData, value: string) => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index] = { ...updatedSubjects[index], [field]: value };
    setSubjects(updatedSubjects);
  };

  const addSubject = () => {
    setSubjects([
      ...subjects,
      { name: "", code: "", description: "", creditHours: "3", facultyId: "none" },
    ]);
  };

  const removeSubject = (index: number) => {
    if (subjects.length > 1) {
      const updatedSubjects = subjects.filter((_, i) => i !== index);
      setSubjects(updatedSubjects);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const creditsValue = formData.credits ? parseInt(formData.credits, 10) : null;

      const processedSubjects = subjects.map((subject) => ({
        ...subject,
        creditHours: parseInt(subject.creditHours, 10),
        facultyId: subject.facultyId === "none" ? null : subject.facultyId,
      }));

      const response = await fetch("/api/admin/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          credits: creditsValue,
          facultyId: formData.facultyId === "none" ? null : formData.facultyId,
          subjects: processedSubjects,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Course created successfully with subjects",
        });
        router.push("/admin/courses");
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to create course");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Create New Course</h1>
            <Button variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Course Name<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="branch">
                    Branch<span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="branch"
                    name="branch"
                    value={formData.branch}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">
                    Year<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.year}
                    onValueChange={(value) => handleSelectChange("year", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1st Year</SelectItem>
                      <SelectItem value="2">2nd Year</SelectItem>
                      <SelectItem value="3">3rd Year</SelectItem>
                      <SelectItem value="4">4th Year</SelectItem>
                      <SelectItem value="5">5th Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="semester">
                    Semester<span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.semester}
                    onValueChange={(value) => handleSelectChange("semester", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                      <SelectItem value="3">Semester 3</SelectItem>
                      <SelectItem value="4">Semester 4</SelectItem>
                      <SelectItem value="5">Semester 5</SelectItem>
                      <SelectItem value="6">Semester 6</SelectItem>
                      <SelectItem value="7">Semester 7</SelectItem>
                      <SelectItem value="8">Semester 8</SelectItem>
                      <SelectItem value="9">Semester 9</SelectItem>
                      <SelectItem value="10">Semester 10</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="credits">Credits (Optional)</Label>
                  <Input
                    id="credits"
                    name="credits"
                    type="number"
                    value={formData.credits}
                    onChange={handleChange}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="facultyId">Course Coordinator</Label>
                  <Select
                    value={formData.facultyId}
                    onValueChange={(value) => handleSelectChange("facultyId", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select faculty coordinator" />
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

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Course Subjects</h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addSubject}
                    className="flex items-center gap-2"
                  >
                    <PlusCircle size={16} />
                    Add Subject
                  </Button>
                </div>

                {subjects.map((subject, index) => (
                  <Card key={index} className="bg-gray-50/50">
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-sm font-medium text-gray-500">Subject {index + 1}</h4>
                        {subjects.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSubject(index)}
                            className="text-red-500 hover:text-red-700 p-1 h-auto"
                          >
                            <Trash2 size={16} />
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor={`subject-name-${index}`}>
                            Subject Name<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`subject-name-${index}`}
                            value={subject.name}
                            onChange={(e) => handleSubjectChange(index, "name", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`subject-code-${index}`}>
                            Subject Code<span className="text-red-500">*</span>
                          </Label>
                          <Input
                            id={`subject-code-${index}`}
                            value={subject.code}
                            onChange={(e) => handleSubjectChange(index, "code", e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`subject-credits-${index}`}>Credit Hours</Label>
                          <Input
                            id={`subject-credits-${index}`}
                            type="number"
                            value={subject.creditHours}
                            onChange={(e) => handleSubjectChange(index, "creditHours", e.target.value)}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`subject-faculty-${index}`}>Faculty</Label>
                          <Select
                            value={subject.facultyId || "none"}
                            onValueChange={(value) => handleSubjectChange(index, "facultyId", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assign faculty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">None</SelectItem>
                              {facultyList.map((faculty) => (
                                <SelectItem key={faculty.id} value={faculty.id}>
                                  {`${faculty.user.profile.firstName} ${faculty.user.profile.lastName}`}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2 sm:col-span-2">
                          <Label htmlFor={`subject-description-${index}`}>
                            Description (Optional)
                          </Label>
                          <Textarea
                            id={`subject-description-${index}`}
                            value={subject.description || ""}
                            onChange={(e) => handleSubjectChange(index, "description", e.target.value)}
                            rows={2}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Creating..." : "Create Course with Subjects"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
