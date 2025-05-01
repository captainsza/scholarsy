"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  BookOpen,
  Users,
  CalendarDays,
  Clock,
  GraduationCap,
  CheckCircle,
  AlertCircle,
  ChevronRight
} from "lucide-react";

interface Subject {
  id: string;
  name: string;
  code: string;
  credits: number;
  isTaught: boolean;
  facultyName: string;
}

interface CourseSchedule {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  roomName: string;
}

interface Course {
  id: string;
  name: string;
  code: string;
  semester: string;
  description: string;
  isCoordinator: boolean;
  credits: number;
  subjectCount: number;
  studentCount: number;
  subjects: Subject[];
  schedule: CourseSchedule[];
}

export default function FacultyCourses() {
  const { user } = useAuth();
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  
  // Group subjects by course for the "Teaching Subjects" view
  const [subjectsByCourse, setSubjectsByCourse] = useState<Record<string, {
    courseName: string;
    courseId: string;
    semester: string;
    subjects: Subject[];
  }>>({});

  useEffect(() => {
    const fetchCourses = async () => {
      if (!user?.faculty?.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/faculty/courses?facultyId=${user.faculty.id}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setCourses(data.courses || []);
        
        // Group subjects by course for the "Teaching Subjects" view
        const subjectsByCourseTmp: Record<string, {
          courseName: string;
          courseId: string;
          semester: string;
          subjects: Subject[];
        }> = {};
        
        data.courses.forEach((course: Course) => {
          const taughtSubjects = course.subjects.filter(subject => subject.isTaught);
          if (taughtSubjects.length > 0) {
            if (!subjectsByCourseTmp[course.id]) {
              subjectsByCourseTmp[course.id] = {
                courseName: course.name,
                courseId: course.id,
                semester: course.semester,
                subjects: []
              };
            }
            subjectsByCourseTmp[course.id].subjects.push(...taughtSubjects);
          }
        });
        
        setSubjectsByCourse(subjectsByCourseTmp);
      } catch (error) {
        console.error("Failed to fetch faculty courses:", error);
        toast({
          title: "Error",
          description: "Failed to load courses. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [user?.faculty?.id]);

  // Filter courses based on the search query and active tab
  const filteredCourses = courses.filter(course => {
    // Search filter
    const searchMatch = course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Tab filter
    if (activeTab === "coordinating") {
      return searchMatch && course.isCoordinator;
    } else if (activeTab === "teaching") {
      return searchMatch && course.subjects.some(subject => subject.isTaught);
    }
    
    // "all" tab or default
    return searchMatch;
  });

  if (loading) {
    return (
      <FacultyLayout>
        <div className="flex items-center justify-center min-h-screen -mt-16">
          <LoadingSpinner message="Loading courses..." />
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Teaching</h1>
          <p className="text-gray-600 mt-1">
            Manage your courses, subjects, and teaching responsibilities
          </p>
        </div>
        
        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center mb-6 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search courses or subjects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        {/* Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList>
            <TabsTrigger value="all">All Courses</TabsTrigger>
            <TabsTrigger value="teaching">Teaching Subjects</TabsTrigger>
          </TabsList>
          
          {/* All Courses Tab */}
          <TabsContent value="all" className="mt-6">
            {filteredCourses.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-2 text-xl font-medium text-gray-900">No courses found</h3>
                <p className="mt-1 text-gray-500">
                  {searchQuery ? "No courses match your search." : "You haven't been assigned any courses yet."}
                </p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <Card key={course.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between">
                        <div>
                          <CardTitle className="font-bold">{course.name}</CardTitle>
                          <CardDescription className="mt-1">
                            {course.code} | {course.semester}
                          </CardDescription>
                        </div>
                        {course.isCoordinator && (
                          <Badge className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                            Coordinator
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      {course.description ? (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                      ) : (
                        <p className="text-sm text-gray-500 mb-4 italic">No description available</p>
                      )}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>{course.studentCount} Students</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <BookOpen className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>{course.subjectCount} Subjects</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <GraduationCap className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>{course.credits} Credits</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <CalendarDays className="h-4 w-4 mr-2 text-indigo-500" />
                          <span>{course.schedule.length} Classes</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0 pb-4">
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => router.push(`/faculty/courses/${course.id}`)}
                      >
                        View Details
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          {/* Teaching Subjects Tab */}
          <TabsContent value="teaching" className="mt-6">
            {Object.keys(subjectsByCourse).length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                <h3 className="mt-2 text-xl font-medium text-gray-900">No teaching subjects found</h3>
                <p className="mt-1 text-gray-500">
                  {searchQuery 
                    ? "No subjects match your search." 
                    : "You aren't assigned to teach any subjects yet."}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {Object.values(subjectsByCourse)
                  .filter(courseGroup => {
                    if (!searchQuery) return true;
                    return (
                      courseGroup.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      courseGroup.subjects.some(subject => 
                        subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        subject.code.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                    );
                  })
                  .map(courseGroup => (
                    <Card key={courseGroup.courseId}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-center">
                          <div>
                            <CardTitle>{courseGroup.courseName}</CardTitle>
                            <CardDescription>{courseGroup.semester}</CardDescription>
                          </div>
                          <Button 
                            variant="outline"
                            onClick={() => router.push(`/faculty/courses/${courseGroup.courseId}`)}
                          >
                            View Course
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-hidden">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Subject
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Code
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Credits
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Actions
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {courseGroup.subjects.map(subject => (
                                <tr key={subject.id}>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">{subject.name}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{subject.code}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm text-gray-500">{subject.credits}</div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <Button 
                                      variant="ghost" 
                                      className="text-indigo-600 hover:text-indigo-900"
                                      onClick={() => router.push(`/faculty/subjects/${subject.id}`)}
                                    >
                                      Manage
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      className="text-indigo-600 hover:text-indigo-900"
                                      onClick={() => router.push(`/faculty/subjects/${subject.id}/attendance`)}
                                    >
                                      Attendance
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </FacultyLayout>
  );
}
