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
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { PlusCircle, Trash2 } from "lucide-react";

// Define proper types for props and state
interface CreateSubjectPageProps {
  params: {
    courseId: string;
    sectionId: string;
  }
}

interface Faculty {
  id: string;
  department: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
    }
  }
}

interface Section {
  id: string;
  name: string;
  course: {
    id: string;
    name: string;
  }
}

interface SubjectFormData {
  name: string;
  code: string;
  description: string;
  creditHours: number;
  facultyId: string;
}

export default function CreateSubjectPage({ params }: CreateSubjectPageProps) {
  const router = useRouter();
  const { courseId, sectionId } = params;
  
  const [loading, setLoading] = useState<boolean>(false);
  const [initialLoading, setInitialLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [section, setSection] = useState<Section | null>(null);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  
  // Track multiple subjects
  const [subjects, setSubjects] = useState<SubjectFormData[]>([{
    name: "",
    code: "",
    description: "",
    creditHours: 3,
    facultyId: "",
  }]);

  // Fetch section details and available faculty
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Fetch section details
        const sectionResponse = await fetch(`/api/admin/sections/${sectionId}`);
        if (!sectionResponse.ok) throw new Error("Failed to fetch section");
        const sectionData = await sectionResponse.json();
        
        // Fetch faculty list
        const facultyResponse = await fetch("/api/admin/faculty");
        if (!facultyResponse.ok) throw new Error("Failed to fetch faculty");
        const facultyData = await facultyResponse.json();
        
        setSection(sectionData.section);
        setFaculty(facultyData.faculty);
      } catch (err) {
        setError("Failed to load data. Please try again.");
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [sectionId]);

  // Handle change for a specific subject
  const handleChange = (index: number, e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    const updatedSubjects = [...subjects];
    
    updatedSubjects[index] = {
      ...updatedSubjects[index],
      [name]: name === "creditHours" ? parseInt(value) : value,
    };
    
    setSubjects(updatedSubjects);
  };
  
  // Handle faculty selection
  const handleFacultyChange = (index: number, facultyId: string): void => {
    const updatedSubjects = [...subjects];
    updatedSubjects[index].facultyId = facultyId;
    setSubjects(updatedSubjects);
  };

  // Add a new subject form
  const addSubject = (): void => {
    setSubjects([...subjects, {
      name: "",
      code: "",
      description: "",
      creditHours: 3,
      facultyId: "",
    }]);
  };

  // Remove a subject form
  const removeSubject = (index: number): void => {
    if (subjects.length === 1) return; // Keep at least one form
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
  };

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    // Validate all subjects
    const invalidSubjects = subjects.filter(
      subject => !subject.name || !subject.code || !subject.creditHours
    );
    
    if (invalidSubjects.length > 0) {
      setError("Please fill in all required fields for all subjects");
      setLoading(false);
      return;
    }

    try {
      // Create all subjects one by one
      for (const subject of subjects) {
        const response = await fetch(`/api/admin/sections/${sectionId}/subjects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(subject),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `Failed to create subject: ${subject.name}`);
        }
      }

      // Navigate to enrollment page or reset form
      const continueAdding = confirm(`Successfully added ${subjects.length} subject(s). Add more subjects?`);
      
      if (continueAdding) {
        // Reset form for adding more subjects
        setSubjects([{
          name: "",
          code: "",
          description: "",
          creditHours: 3,
          facultyId: "",
        }]);
      } else {
        // Go to student enrollment page
        router.push(`/admin/courses/${courseId}/sections/${sectionId}/enroll`);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading data..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Add Subjects</h1>
            <p className="mt-1 text-sm text-gray-500">
              Add subjects to {section?.name} - {section?.course?.name}
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {subjects.map((subject, index) => (
              <Card key={index} className="relative">
                {subjects.length > 1 && (
                  <button 
                    type="button"
                    onClick={() => removeSubject(index)}
                    className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <CardHeader>
                  <CardTitle>Subject {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor={`name-${index}`} className="block text-sm font-medium text-gray-700">
                        Subject Name*
                      </label>
                      <Input
                        id={`name-${index}`}
                        name="name"
                        value={subject.name}
                        onChange={(e) => handleChange(index, e)}
                        required
                        placeholder="e.g., Database Management"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label htmlFor={`code-${index}`} className="block text-sm font-medium text-gray-700">
                        Subject Code*
                      </label>
                      <Input
                        id={`code-${index}`}
                        name="code"
                        value={subject.code}
                        onChange={(e) => handleChange(index, e)}
                        required
                        placeholder="e.g., CS-301"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label htmlFor={`creditHours-${index}`} className="block text-sm font-medium text-gray-700">
                        Credit Hours*
                      </label>
                      <Input
                        id={`creditHours-${index}`}
                        name="creditHours"
                        type="number"
                        min="1"
                        max="6"
                        value={subject.creditHours}
                        onChange={(e) => handleChange(index, e)}
                        required
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <label htmlFor={`facultyId-${index}`} className="block text-sm font-medium text-gray-700">
                        Assign Faculty
                      </label>
                      {/* Improved faculty select component */}
                      <select
                        id={`facultyId-${index}`}
                        name="facultyId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        value={subject.facultyId}
                        onChange={(e) => handleFacultyChange(index, e.target.value)}
                      >
                        <option value="">Select Faculty (Optional)</option>
                        {faculty.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.user.profile.firstName} {f.user.profile.lastName} - {f.department}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label htmlFor={`description-${index}`} className="block text-sm font-medium text-gray-700">
                        Description
                      </label>
                      <textarea
                        id={`description-${index}`}
                        name="description"
                        value={subject.description}
                        onChange={(e) => handleChange(index, e)}
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Brief description of this subject"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                onClick={addSubject}
                className="flex items-center"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Another Subject
              </Button>
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
                {loading ? "Adding..." : `Save Subject${subjects.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
}