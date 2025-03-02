"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Checkbox } from "@/components/ui/checkbox";

export default function EnrollStudentsPage({ params }) {
  const router = useRouter();
  const { courseId, sectionId } = params;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [section, setSection] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch section details and available students
  useEffect(() => {
    const fetchData = async () => {
      try {
        setInitialLoading(true);
        
        // Fetch section details
        const sectionResponse = await fetch(`/api/admin/sections/${sectionId}`);
        if (!sectionResponse.ok) throw new Error("Failed to fetch section");
        const sectionData = await sectionResponse.json();
        
        // Fetch students not enrolled in this section
        const studentsResponse = await fetch(`/api/admin/students?notInSection=${sectionId}`);
        if (!studentsResponse.ok) throw new Error("Failed to fetch students");
        const studentsData = await studentsResponse.json();
        
        setSection(sectionData.section);
        setStudents(studentsData.students);
      } catch (err) {
        setError("Failed to load data. Please try again.");
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchData();
  }, [sectionId]);

  const toggleStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSubmit = async () => {
    if (selectedStudents.length === 0) {
      setError("Please select at least one student to enroll.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const response = await fetch(`/api/admin/sections/${sectionId}/enroll`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentIds: selectedStudents,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to enroll students");
      }

      // Navigate back to section details after successful enrollment
      router.push(`/admin/courses/${courseId}/sections/${sectionId}`);
    } catch (err) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = searchQuery
    ? students.filter(student => 
        `${student.user.profile.firstName} ${student.user.profile.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.enrollmentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

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
            <h1 className="text-2xl font-bold text-gray-900">Enroll Students</h1>
            <p className="mt-1 text-sm text-gray-500">
              Enroll students to {section?.name} - {section?.course?.name} ({section?.course?.code})
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Available Students</CardTitle>
              <div className="relative w-64">
                <input
                  type="text"
                  placeholder="Search students..."
                  className="w-full rounded-md border border-gray-300 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <p className="text-sm text-gray-500">
                  Available spots: {section?.capacity - (section?.enrollments?.length || 0)} out of {section?.capacity}
                </p>
                <div className="mt-2 flex justify-end">
                  <Button 
                    type="button" 
                    onClick={() => setSelectedStudents(filteredStudents.map(s => s.id))}
                    variant="outline" 
                    size="sm"
                  >
                    Select All
                  </Button>
                  <Button 
                    type="button" 
                    onClick={() => setSelectedStudents([])}
                    variant="outline" 
                    size="sm"
                    className="ml-2"
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>

              <div className="max-h-[500px] overflow-y-auto border rounded-md">
                {filteredStudents.length === 0 ? (
                  <p className="p-4 text-center text-gray-500">No students available to enroll.</p>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Select
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Enrollment ID
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Department
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredStudents.map(student => (
                        <tr 
                          key={student.id} 
                          className={selectedStudents.includes(student.id) ? "bg-blue-50" : "hover:bg-gray-50"}
                          onClick={() => toggleStudent(student.id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Checkbox 
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => toggleStudent(student.id)}
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.enrollmentId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.user.profile.firstName} {student.user.profile.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {student.department}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  disabled={loading || selectedStudents.length === 0}
                >
                  {loading 
                    ? "Enrolling..." 
                    : `Enroll ${selectedStudents.length} Student${selectedStudents.length !== 1 ? 's' : ''}`
                  }
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
