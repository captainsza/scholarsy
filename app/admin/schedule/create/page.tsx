"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "@/components/ui/toastall";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Calendar, Clock, Building, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

// Form validation schema
const scheduleFormSchema = z.object({
  courseId: z.string({
    required_error: "Please select a course",
  }),
  dayOfWeek: z.string({
    required_error: "Please select a day of the week",
  }),
  startTime: z.string({
    required_error: "Please select a start time",
  }),
  endTime: z.string({
    required_error: "Please select an end time",
  }).refine((endTime, ctx) => {
    const { startTime } = ctx.parent;
    if (!startTime || !endTime) return true;
    return endTime > startTime;
  }, {
    message: "End time must be after start time",
  }),
  roomId: z.string().optional(),
});

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>;

type Course = {
  id: string;
  name: string;
  branch: string;
  semester: string;
  year: string;
};

type Room = {
  id: string;
  name: string;
  type: string;
  capacity: number;
};

export default function CreateSchedulePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const duplicateId = searchParams.get('duplicate');
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initialize form with default values
  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      courseId: "",
      dayOfWeek: "",
      startTime: "",
      endTime: "",
      roomId: "",
    },
  });

  // Load courses and rooms data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoadingInitial(true);
        
        // Fetch courses
        const coursesResponse = await fetch('/api/admin/courses');
        if (!coursesResponse.ok) {
          throw new Error('Failed to fetch courses');
        }
        const coursesData = await coursesResponse.json();
        setCourses(coursesData.courses || []);
        
        // Fetch rooms
        const roomsResponse = await fetch('/api/admin/rooms');
        if (!roomsResponse.ok) {
          throw new Error('Failed to fetch rooms');
        }
        const roomsData = await roomsResponse.json();
        setRooms(roomsData.rooms || []);
        
        // If duplicating, fetch original schedule data
        if (duplicateId) {
          const scheduleResponse = await fetch(`/api/admin/schedule/${duplicateId}`);
          if (scheduleResponse.ok) {
            const scheduleData = await scheduleResponse.json();
            form.reset({
              courseId: scheduleData.courseId,
              dayOfWeek: scheduleData.dayOfWeek,
              startTime: scheduleData.startTime,
              endTime: scheduleData.endTime,
              roomId: scheduleData.roomId || "",
            });
          }
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: "Error",
          description: "Failed to load necessary data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoadingInitial(false);
      }
    };

    fetchData();
  }, [duplicateId, form]);

  const onSubmit = async (values: ScheduleFormValues) => {
    try {
      setSubmitting(true);
      
      // Convert "no-room" value to null or undefined before sending to API
      const formData = {
        ...values,
        roomId: values.roomId === "no-room" ? undefined : values.roomId,
      };
      
      const response = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        // Try to get the error message from the response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create schedule');
        } catch {
          throw new Error('Failed to create schedule');
        }
      }
      
      toast({
        title: "Success",
        description: "Schedule created successfully",
      });
      
      // Redirect back to schedule list
      router.push('/admin/schedule');
    } catch (error: any) {
      console.error('Error creating schedule:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const dayOptions = [
    { value: "Monday", label: "Monday" },
    { value: "Tuesday", label: "Tuesday" },
    { value: "Wednesday", label: "Wednesday" },
    { value: "Thursday", label: "Thursday" },
    { value: "Friday", label: "Friday" },
    { value: "Saturday", label: "Saturday" },
    { value: "Sunday", label: "Sunday" },
  ];

  // Generate time options from 7:00 to 21:00 (7AM to 9PM)
  const timeOptions = Array.from({ length: 29 }, (_, i) => {
    const hour = Math.floor(i / 2) + 7;
    const minute = (i % 2) * 30;
    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
    
    let displayTime;
    if (hour < 12) {
      displayTime = `${hour}:${minute.toString().padStart(2, '0')} AM`;
    } else if (hour === 12) {
      displayTime = `12:${minute.toString().padStart(2, '0')} PM`;
    } else {
      displayTime = `${hour - 12}:${minute.toString().padStart(2, '0')} PM`;
    }
    
    return { value: time, label: displayTime };
  });

  if (loadingInitial) {
    return (
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <LoadingSpinner message="Loading schedule data..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Schedule</h1>
            <p className="mt-1 text-sm text-gray-500">Add a new class schedule entry</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Schedule Details</CardTitle>
            <CardDescription>
              Enter the details for the new class schedule
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course Selection */}
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Course</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <div className="flex items-center gap-2">
                                <BookOpen className="h-4 w-4 text-gray-500" />
                                <SelectValue placeholder="Select a course" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {courses.map((course) => (
                              <SelectItem key={course.id} value={course.id}>
                                {course.name} - {course.semester} ({course.branch})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The course for which this schedule applies
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Day of Week Selection */}
                  <FormField
                    control={form.control}
                    name="dayOfWeek"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Day of Week</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500" />
                                <SelectValue placeholder="Select a day" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {dayOptions.map((day) => (
                              <SelectItem key={day.value} value={day.value}>
                                {day.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The day when this class takes place
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Time Selection */}
                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <SelectValue placeholder="Select start time" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          When the class begins
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* End Time Selection */}
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <SelectValue placeholder="Select end time" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timeOptions.map((time) => (
                              <SelectItem key={time.value} value={time.value}>
                                {time.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          When the class ends
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Room Selection */}
                  <FormField
                    control={form.control}
                    name="roomId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Room (Optional)</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <div className="flex items-center gap-2">
                                <Building className="h-4 w-4 text-gray-500" />
                                <SelectValue placeholder="Select a room" />
                              </div>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="no-room">No room assigned</SelectItem>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name} ({room.capacity} capacity)
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          The room where this class takes place
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full md:w-auto" 
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Schedule"
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="bg-gray-50/50 border-t flex justify-between">
            <p className="text-xs text-gray-500">
              * Make sure to check for scheduling conflicts before creating a new entry
            </p>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}
