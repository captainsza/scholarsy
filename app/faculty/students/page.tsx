"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/Badge";
import { Search, Users, Mail, Phone, BookOpen, AlertCircle } from "lucide-react";

interface StudentCourse {
  id: string;
  name: string;
  branch: string;
  year: string;
  semester: string;
}

interface StudentSubject {
  id: string;
  name: string;
  code: string;
  courseName: string;
}

interface Student {
  id: string;
  enrollmentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profileImage?: string;
  courses: StudentCourse[];
  subjects: StudentSubject[];
}

export default function FacultyStudentsPage() {
  const { user, loading: authLoading } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchStudents = async () => {
      if (!user || user.role !== "FACULTY") {
        setLoading(false);
        if (!authLoading) setError("Access denied. Please log in as faculty.");
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch("/api/faculty/students");

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error: ${response.status}`);
        }

        const data = await response.json();
        setStudents(data.students || []);
      } catch (err: any) {
        console.error("Failed to fetch students:", err);
        setError(err.message || "Failed to load students.");
        toast({
          title: "Error",
          description: err.message || "Could not load student data.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchStudents();
    }
  }, [user, authLoading]);

  const filteredStudents = students.filter((student) => {
    const fullName = `${student.firstName} ${student.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return (
      fullName.includes(searchLower) ||
      student.enrollmentId.toLowerCase().includes(searchLower) ||
      student.email.toLowerCase().includes(searchLower) ||
      student.courses.some(c => c.name.toLowerCase().includes(searchLower)) ||
      student.subjects.some(s => s.name.toLowerCase().includes(searchLower) || s.code.toLowerCase().includes(searchLower))
    );
  });

  if (authLoading || loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center min-h-screen -mt-16">
          <LoadingSpinner message="Loading students..." />
        </div>
      </FacultyLayout>
    );
  }

  if (error) {
    return (
      <FacultyLayout>
        <div className="p-8 max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Error Loading Students</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <CardHeader className="px-0 mb-6">
          <CardTitle className="text-2xl font-bold text-gray-900">My Students</CardTitle>
          <CardDescription>
            View students enrolled in your courses and subjects.
          </CardDescription>
        </CardHeader>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              placeholder="Search students by name, ID, email, course, or subject..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Users className="mx-auto h-16 w-16 text-gray-400" />
            <h3 className="mt-2 text-xl font-medium text-gray-900">No Students Found</h3>
            <p className="mt-1 text-gray-500">
              {searchTerm
                ? "No students match your search criteria."
                : "You currently have no students assigned to your courses or subjects."}
            </p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Enrollment ID</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Associated Courses/Subjects</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage src={student.profileImage || undefined} alt={`${student.firstName} ${student.lastName}`} />
                              <AvatarFallback>
                                {student.firstName?.[0]}
                                {student.lastName?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-gray-500">{student.enrollmentId}</TableCell>
                        <TableCell>
                          <div className="text-sm text-gray-900 flex items-center">
                            <Mail className="h-4 w-4 mr-1.5 text-gray-400" /> {student.email}
                          </div>
                          {student.phone && (
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <Phone className="h-4 w-4 mr-1.5 text-gray-400" /> {student.phone}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {student.courses.map(course => (
                               <Badge key={`${student.id}-${course.id}`} variant="default" className="mr-1 mb-1 text-xs">
                                {course.name} ({course.branch} - {course.year} Sem {course.semester})
                               </Badge>
                            ))}
                            {student.subjects.map(subject => (
                              <Badge key={`${student.id}-${subject.id}`} variant="outline" className="mr-1 mb-1 text-xs">
                                {subject.name} ({subject.code}) - {subject.courseName}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </FacultyLayout>
  );
}
