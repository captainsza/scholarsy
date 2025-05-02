"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";
import { 
  FileText, 
  Clock, 
  CalendarIcon, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Upload, 
  Download,
  Eye,
  AlertTriangle
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

// Type definitions for assessments data
interface Assessment {
  id: string;
  title: string;
  type: string;
  maxMarks: number;
  weightage: number;
  dueDate: string | null;
  instructions: string | null;
  attachmentUrl: string | null;
  subjectName: string;
  subjectCode: string;
  courseName: string;
  facultyName: string;
  isSubmitted: boolean;
  isGraded: boolean;
  marksObtained: number | null;
  feedback: string | null;
  submissionId: string | null;
  submittedAt: string | null;
  fileUrl: string | null;
}

// Interface for API response
interface AssessmentResponse {
  upcoming: Assessment[];
  past: Assessment[];
  completed: Assessment[];
  stats: {
    total: number;
    completed: number;
    pending: number;
    missed: number;
  };
}

export default function StudentAssignmentsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AssessmentResponse | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");

  useEffect(() => {
    const fetchAssignments = async () => {
      if (!user?.student?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/student/assessments?studentId=${user.student.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch assignments");
        }
        
        const responseData = await response.json();
        setData(responseData);
      } catch (err: any) {
        console.error("Error fetching assignments:", err);
        setError(err.message || "Failed to load assignments");
        toast({
          title: "Error",
          description: "Failed to load assignments. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  // Filter data based on search query and type
  const filterData = (assignments: Assessment[]) => {
    if (!assignments) return [];
    
    return assignments.filter(assessment => {
      const matchesSearch = searchQuery === "" || 
        assessment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.subjectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assessment.subjectCode.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = selectedType === "all" || assessment.type === selectedType;
      
      return matchesSearch && matchesType;
    });
  };

  const filteredUpcoming = data?.upcoming ? filterData(data.upcoming) : [];
  const filteredPast = data?.past ? filterData(data.past) : [];
  const filteredCompleted = data?.completed ? filterData(data.completed) : [];

  // Navigation to assignment detail page
  const viewAssignmentDetails = (id: string) => {
    router.push(`/student/assignments/${id}`);
  };

  if (loading) {
    return (
      <StudentLayout>
        <LoadingSpinner message="Loading assignments..." />
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Assignments</h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your assignments across all subjects
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 p-4 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Assignment Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total</p>
                  <p className="text-2xl font-bold text-blue-800">{data?.stats.total || 0}</p>
                </div>
                <div className="bg-blue-200/60 p-2 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-green-600">Completed</p>
                  <p className="text-2xl font-bold text-green-800">{data?.stats.completed || 0}</p>
                </div>
                <div className="bg-green-200/60 p-2 rounded-full">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-800">{data?.stats.pending || 0}</p>
                </div>
                <div className="bg-yellow-200/60 p-2 rounded-full">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-50 to-red-100">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-red-600">Missed</p>
                  <p className="text-2xl font-bold text-red-800">{data?.stats.missed || 0}</p>
                </div>
                <div className="bg-red-200/60 p-2 rounded-full">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input 
              className="pl-10" 
              placeholder="Search assignments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <select 
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="ASSIGNMENT">Assignments</option>
            <option value="QUIZ">Quizzes</option>
            <option value="PROJECT">Projects</option>
            <option value="MIDTERM">Midterms</option>
            <option value="FINAL">Finals</option>
          </select>
        </div>

        <Tabs defaultValue="upcoming" className="mb-6">
          <TabsList className="mb-4">
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Submitted</TabsTrigger>
            <TabsTrigger value="past">Past Due</TabsTrigger>
          </TabsList>

          {/* Upcoming assignments */}
          <TabsContent value="upcoming">
            {filteredUpcoming.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600">No upcoming assignments</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchQuery || selectedType !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "You're all caught up!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredUpcoming.map(assignment => (
                  <Card key={assignment.id} className="overflow-hidden">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:flex-1 p-5">
                        <div className="flex justify-between">
                          <div>
                            <Badge 
                              variant={
                                assignment.type === 'ASSIGNMENT' ? 'success' :
                                assignment.type === 'QUIZ' ? 'default' :
                                assignment.type === 'PROJECT' ? 'outline' :
                                assignment.type === 'MIDTERM' || assignment.type === 'FINAL' ? 'info' :
                                'outline'
                              }
                              className="mb-2"
                            >
                              {assignment.type.charAt(0) + assignment.type.slice(1).toLowerCase()}
                            </Badge>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {assignment.subjectCode}: {assignment.subjectName}
                            </p>
                            <p className="text-xs text-gray-500">By {assignment.facultyName}</p>
                          </div>
                          
                          {assignment.maxMarks && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-600">Max Marks</p>
                              <p className="text-lg font-bold text-gray-900">{assignment.maxMarks}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-4 flex items-center">
                          <Clock className="h-4 w-4 text-amber-500 mr-1" />
                          <span className="text-sm text-amber-600">
                            Due {assignment.dueDate ? formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true }) : "No deadline"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 md:w-48 p-5 flex flex-row md:flex-col md:justify-center items-center">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="mr-2 md:mr-0 md:mb-2"
                          onClick={() => viewAssignmentDetails(assignment.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        
                        <Button 
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => viewAssignmentDetails(assignment.id)}
                        >
                          <Upload className="h-4 w-4 mr-1" /> Submit
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Submitted assignments */}
          <TabsContent value="completed">
            {filteredCompleted.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600">No submitted assignments</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchQuery || selectedType !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "You haven't submitted any assignments yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredCompleted.map(assignment => (
                  <Card key={assignment.id} className={assignment.isGraded ? "border-l-4 border-l-green-500" : ""}>
                    <div className="flex flex-col md:flex-row">
                      <div className="md:flex-1 p-5">
                        <div className="flex justify-between">
                          <div>
                            <Badge 
                              variant={
                                assignment.type === 'ASSIGNMENT' ? 'success' :
                                assignment.type === 'QUIZ' ? 'default' :
                                assignment.type === 'PROJECT' ? 'outline' :
                                assignment.type === 'MIDTERM' || assignment.type === 'FINAL' ? 'info' :
                                'outline'
                              }
                              className="mb-2"
                            >
                              {assignment.type.charAt(0) + assignment.type.slice(1).toLowerCase()}
                            </Badge>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 mb-1">
                              {assignment.subjectCode}: {assignment.subjectName}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <p className="mr-3">Submitted: {new Date(assignment.submittedAt!).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          {assignment.isGraded ? (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-600">Marks</p>
                              <p className="text-lg font-bold text-green-600">{assignment.marksObtained} / {assignment.maxMarks}</p>
                            </div>
                          ) : (
                            <Badge variant="outline" className="h-fit">Pending</Badge>
                          )}
                        </div>
                        
                        {assignment.isGraded && assignment.feedback && (
                          <div className="mt-3 text-sm">
                            <p className="font-medium text-gray-700">Feedback:</p>
                            <p className="text-gray-600 italic">{assignment.feedback}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="bg-gray-50 md:w-48 p-5 flex flex-row md:flex-col md:justify-center items-center">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="mr-2 md:mr-0 md:mb-2"
                          onClick={() => viewAssignmentDetails(assignment.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        
                        {assignment.fileUrl && (
                          <Button 
                            variant="outline"
                            size="sm"
                            className="text-blue-600"
                            onClick={() => window.open(assignment.fileUrl!, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-1" /> Download
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Past due assignments */}
          <TabsContent value="past">
            {filteredPast.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center">
                  <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-600">No past due assignments</h3>
                  <p className="text-gray-500 text-sm mt-1">
                    {searchQuery || selectedType !== "all" 
                      ? "Try adjusting your search or filters" 
                      : "Great job staying on top of your work!"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredPast.map(assignment => (
                  <Card key={assignment.id} className="border-l-4 border-l-red-500">
                    <div className="flex flex-col md:flex-row">
                      <div className="md:flex-1 p-5">
                        <div className="flex justify-between">
                          <div>
                            <Badge 
                              variant={
                                assignment.type === 'ASSIGNMENT' ? 'success' :
                                assignment.type === 'QUIZ' ? 'default' :
                                assignment.type === 'PROJECT' ? 'outline' :
                                assignment.type === 'MIDTERM' || assignment.type === 'FINAL' ? 'info' :
                                'outline'
                              }
                              className="mb-2"
                            >
                              {assignment.type.charAt(0) + assignment.type.slice(1).toLowerCase()}
                            </Badge>
                            
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{assignment.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {assignment.subjectCode}: {assignment.subjectName}
                            </p>
                          </div>
                          
                          {assignment.maxMarks && (
                            <div className="text-right">
                              <p className="text-sm font-medium text-gray-600">Max Marks</p>
                              <p className="text-lg font-bold text-gray-900">{assignment.maxMarks}</p>
                            </div>
                          )}
                        </div>
                        
                        <div className="mt-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-sm text-red-600">
                            Due date passed {assignment.dueDate ? formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true }) : ""}
                          </span>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 md:w-48 p-5 flex flex-row md:flex-col md:justify-center items-center">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="mr-2 md:mr-0 md:mb-2"
                          onClick={() => viewAssignmentDetails(assignment.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" /> View
                        </Button>
                        
                        <Button 
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => viewAssignmentDetails(assignment.id)}
                        >
                          <Upload className="h-4 w-4 mr-1" /> Submit Late
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </StudentLayout>
  );
}
