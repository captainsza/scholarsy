"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  BookOpen,
  Plus,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";

interface FacultySchedulePageProps {
  params: {
    facultyId: string;
  };
}

export default function AdminFacultySchedulePage({ params }: FacultySchedulePageProps) {
  const { facultyId } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFacultySchedule = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/admin/faculty/${facultyId}`);
        
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Faculty not found");
          }
          throw new Error("Failed to fetch faculty schedule");
        }
        
        const data = await response.json();
        setFacultyData(data.faculty);
      } catch (err: any) {
        console.error("Error fetching faculty schedule:", err);
        setError(err.message || "Failed to load faculty schedule");
        toast({
          title: "Error",
          description: "Failed to load faculty schedule",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFacultySchedule();
  }, [facultyId]);

  // Format time string (e.g., "14:30" to "2:30 PM")
  const formatTime = (timeString: string) => {
    try {
      const [hours, minutes] = timeString.split(':');
      const hour = parseInt(hours, 10);
      const period = hour >= 12 ? 'PM' : 'AM';
      return `${hour % 12 || 12}:${minutes} ${period}`;
    } catch {
      return timeString;
    }
  };

  // Group schedule by day of week
  const scheduleByDay = facultyData?.schedules?.reduce((acc: any, schedule: any) => {
    if (!acc[schedule.dayOfWeek]) {
      acc[schedule.dayOfWeek] = [];
    }
    acc[schedule.dayOfWeek].push(schedule);
    return acc;
  }, {});

  // Days of week in order
  const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner message="Loading faculty schedule..." />
        </div>
      </AdminLayout>
    );
  }

  if (error || !facultyData) {
    return (
      <AdminLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">{error || "Faculty not found"}</p>
            <Button 
              onClick={() => router.push("/admin/faculty")}
              className="mt-4"
              variant="outline"
            >
              Back to Faculty Management
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/faculty/${facultyId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Profile
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Faculty Schedule</h1>
          </div>
          <Button
            onClick={() => router.push(`/admin/faculty/${facultyId}/schedule/create`)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Schedule
          </Button>
        </div>

        {/* Faculty Info Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>
              {facultyData.user?.profile?.firstName} {facultyData.user?.profile?.lastName}
            </CardTitle>
            <CardDescription>
              {facultyData.department} Department
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {facultyData.schedules?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Total Classes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {Object.keys(scheduleByDay || {}).length}
                </div>
                <div className="text-sm text-gray-500">Active Days</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {facultyData.subjects?.length || 0}
                </div>
                <div className="text-sm text-gray-500">Subjects</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Weekly Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Class schedule organized by day of the week
            </CardDescription>
          </CardHeader>
          <CardContent>
            {scheduleByDay && Object.keys(scheduleByDay).length > 0 ? (
              <div className="space-y-6">
                {daysOrder.map(day => {
                  const daySchedules = scheduleByDay[day];
                  if (!daySchedules || daySchedules.length === 0) return null;

                  return (
                    <div key={day} className="border rounded-lg p-4">
                      <h3 className="text-lg font-medium mb-3 flex items-center">
                        <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                        {day}
                        <Badge variant="outline" className="ml-2">
                          {daySchedules.length} {daySchedules.length === 1 ? 'class' : 'classes'}
                        </Badge>
                      </h3>
                      
                      <div className="grid gap-3">
                        {daySchedules
                          .sort((a: any, b: any) => a.startTime.localeCompare(b.startTime))
                          .map((schedule: any, index: number) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                              <div className="flex-1">
                                <div className="font-medium">{schedule.courseName}</div>
                                <div className="flex items-center text-sm text-gray-500 mt-1">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                                  {schedule.room && (
                                    <>
                                      <MapPin className="h-4 w-4 mr-1 ml-4" />
                                      {schedule.room.name}
                                    </>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge 
                                  variant={schedule.room?.type === 'LAB' ? 'secondary' : 'default'}
                                >
                                  {schedule.room?.type || 'Class'}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No schedule found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  This faculty member has no classes scheduled yet.
                </p>
                <Button 
                  className="mt-4"
                  onClick={() => router.push(`/admin/faculty/${facultyId}/schedule/create`)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Schedule
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* All Schedules Table */}
        {facultyData.schedules && facultyData.schedules.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>All Schedules</CardTitle>
              <CardDescription>
                Complete list of all scheduled classes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Day</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Room</TableHead>
                    <TableHead>Type</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facultyData.schedules
                    .sort((a: any, b: any) => {
                      const dayOrder = daysOrder.indexOf(a.dayOfWeek) - daysOrder.indexOf(b.dayOfWeek);
                      if (dayOrder !== 0) return dayOrder;
                      return a.startTime.localeCompare(b.startTime);
                    })
                    .map((schedule: any, index: number) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Badge variant="outline">{schedule.dayOfWeek}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                            {formatTime(schedule.startTime)} - {formatTime(schedule.endTime)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{schedule.courseName}</div>
                        </TableCell>
                        <TableCell>
                          {schedule.room ? (
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                              {schedule.room.name}
                            </div>
                          ) : (
                            <span className="text-gray-400">Not assigned</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={schedule.room?.type === 'LAB' ? 'secondary' : 'default'}
                          >
                            {schedule.room?.type || 'Classroom'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
