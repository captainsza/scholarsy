"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "@/components/ui/toastall";
import { AlertCircle, ArrowLeft, Calendar, Clock, Loader2, Plus, Trash2, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/Badge";

interface ScheduleItem {
  id: string;
  subjectId: string;
  facultyId: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: string;
  autoAssignFaculty: boolean;
}

export default function CreateSchedulePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course data
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  // Subject data
  const [subjects, setSubjects] = useState<any[]>([]);
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Faculty data
  const [faculty, setFaculty] = useState<any[]>([]);

  // Room data
  const [rooms, setRooms] = useState<any[]>([]);

  // Room creation state
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<"CLASSROOM" | "LAB">("CLASSROOM");
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(30);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Multiple schedule items
  const [scheduleItems, setScheduleItems] = useState<ScheduleItem[]>([
    {
      id: "1",
      subjectId: "",
      facultyId: "",
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      roomId: "none",
      autoAssignFaculty: true,
    }
  ]);

  // Bulk creation options
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSettings, setBulkSettings] = useState({
    dayOfWeek: "Monday",
    startTime: "09:00",
    duration: 60, // minutes
    roomId: "none",
    autoAssignFaculty: true,
  });

  // Form validation
  const [isFormValid, setIsFormValid] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch courses
        const coursesRes = await fetch('/api/admin/courses');
        if (!coursesRes.ok) throw new Error('Failed to fetch courses');
        const coursesData = await coursesRes.json();
        setCourses(coursesData.courses || []);

        // Fetch rooms
        const roomsRes = await fetch('/api/admin/rooms');
        if (!roomsRes.ok) throw new Error('Failed to fetch rooms');
        const roomsData = await roomsRes.json();
        setRooms(roomsData.rooms || []);

        // Fetch all faculty
        const facultyRes = await fetch('/api/admin/faculty');
        if (!facultyRes.ok) throw new Error('Failed to fetch faculty');
        const facultyData = await facultyRes.json();
        setFaculty(facultyData.faculty || []);

      } catch (err: any) {
        console.error('Error fetching data:', err);
        setError(err.message || 'Failed to load required data');
        toast({
          title: 'Error',
          description: 'Failed to load required data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch subjects when course is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedCourseId) {
        setSubjects([]);
        return;
      }

      try {
        setSubjectsLoading(true);
        const res = await fetch(`/api/admin/courses/${selectedCourseId}/subjects`);
        if (!res.ok) throw new Error('Failed to fetch subjects');

        const data = await res.json();
        setSubjects(data.subjects || []);

      } catch (err: any) {
        console.error('Error fetching subjects:', err);
        toast({
          title: 'Error',
          description: 'Failed to load subjects',
          variant: 'destructive',
        });
      } finally {
        setSubjectsLoading(false);
      }
    };

    fetchSubjects();
  }, [selectedCourseId]);

  // Auto-assign faculty when subject is selected
  const handleSubjectChange = (itemId: string, subjectId: string) => {
    setScheduleItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const updatedItem = { ...item, subjectId };
        
        if (item.autoAssignFaculty && subjectId) {
          const selectedSubject = subjects.find(s => s.id === subjectId);
          if (selectedSubject && selectedSubject.facultyId) {
            updatedItem.facultyId = selectedSubject.facultyId;
          } else {
            updatedItem.facultyId = '';
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // Add new schedule item
  const addScheduleItem = () => {
    const newItem: ScheduleItem = {
      id: Date.now().toString(),
      subjectId: "",
      facultyId: "",
      dayOfWeek: "Monday",
      startTime: "09:00",
      endTime: "10:00",
      roomId: "none",
      autoAssignFaculty: true,
    };
    setScheduleItems(prev => [...prev, newItem]);
  };

  // Remove schedule item
  const removeScheduleItem = (itemId: string) => {
    if (scheduleItems.length > 1) {
      setScheduleItems(prev => prev.filter(item => item.id !== itemId));
    }
  };

  // Update schedule item
  const updateScheduleItem = (itemId: string, field: keyof ScheduleItem, value: any) => {
    setScheduleItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  // Bulk create from selected subjects
  const handleBulkCreate = () => {
    if (!subjects.length) {
      toast({
        title: 'Error',
        description: 'No subjects available for bulk creation',
        variant: 'destructive',
      });
      return;
    }

    const newItems: ScheduleItem[] = subjects.map((subject, index) => {
      const startHour = parseInt(bulkSettings.startTime.split(':')[0]);
      const startMinute = parseInt(bulkSettings.startTime.split(':')[1]);
      const totalMinutes = startHour * 60 + startMinute + (index * bulkSettings.duration);
      const newStartHour = Math.floor(totalMinutes / 60);
      const newStartMinute = totalMinutes % 60;
      const endTotalMinutes = totalMinutes + bulkSettings.duration;
      const endHour = Math.floor(endTotalMinutes / 60);
      const endMinute = endTotalMinutes % 60;

      return {
        id: `bulk-${index}`,
        subjectId: subject.id,
        facultyId: bulkSettings.autoAssignFaculty ? (subject.facultyId || '') : '',
        dayOfWeek: bulkSettings.dayOfWeek,
        startTime: `${newStartHour.toString().padStart(2, '0')}:${newStartMinute.toString().padStart(2, '0')}`,
        endTime: `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`,
        roomId: bulkSettings.roomId,
        autoAssignFaculty: bulkSettings.autoAssignFaculty,
      };
    });

    setScheduleItems(newItems);
    setBulkMode(false);
  };

  // Validate form
  useEffect(() => {
    const newFieldErrors: Record<string, string> = {};

    if (!selectedCourseId) newFieldErrors.course = "Course is required";

    scheduleItems.forEach((item, index) => {
      if (!item.subjectId) newFieldErrors[`subject-${index}`] = "Subject is required";
      if (!item.facultyId) newFieldErrors[`faculty-${index}`] = "Faculty is required";
      if (!item.dayOfWeek) newFieldErrors[`day-${index}`] = "Day is required";
      if (!item.startTime) newFieldErrors[`startTime-${index}`] = "Start time is required";
      if (!item.endTime) newFieldErrors[`endTime-${index}`] = "End time is required";
      
      if (item.startTime && item.endTime && item.startTime >= item.endTime) {
        newFieldErrors[`endTime-${index}`] = "End time must be after start time";
      }
    });

    setFieldErrors(newFieldErrors);
    setIsFormValid(Object.keys(newFieldErrors).length === 0);
  }, [selectedCourseId, scheduleItems]);

  // Handle room creation
  const handleCreateRoom = async () => {
    if (!newRoomName || newRoomCapacity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please provide a room name and valid capacity",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreatingRoom(true);

      const res = await fetch('/api/admin/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRoomName,
          type: newRoomType,
          capacity: newRoomCapacity
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to create room");
      }

      const newRoom = await res.json();
      setRooms(prevRooms => [...prevRooms, newRoom.room]);

      toast({
        title: "Success",
        description: "Room created successfully",
      });

      setNewRoomName("");
      setNewRoomType("CLASSROOM");
      setNewRoomCapacity(30);
      setIsRoomDialogOpen(false);

    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to create room",
        variant: "destructive",
      });
    } finally {
      setCreatingRoom(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      toast({
        title: 'Validation Error',
        description: 'Please correct the errors in the form',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const promises = scheduleItems.map(item => {
        const scheduleData = {
          courseId: selectedCourseId,
          subjectId: item.subjectId,
          facultyId: item.facultyId,
          dayOfWeek: item.dayOfWeek,
          startTime: item.startTime,
          endTime: item.endTime,
          ...(item.roomId !== "none" && { roomId: item.roomId })
        };

        return fetch('/api/admin/schedule', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scheduleData),
        });
      });

      const results = await Promise.allSettled(promises);
      
      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const failedCount = results.filter(result => result.status === 'rejected').length;

      if (successCount > 0) {
        toast({
          title: 'Success',
          description: `${successCount} schedule(s) created successfully${failedCount > 0 ? `, ${failedCount} failed` : ''}`,
        });
        
        if (failedCount === 0) {
          router.push('/admin/schedule');
        }
      } else {
        throw new Error('All schedule creations failed');
      }

    } catch (err: any) {
      console.error('Error creating schedules:', err);
      setError(err.message || 'Failed to create schedules');
      toast({
        title: 'Error',
        description: err.message || 'Failed to create schedules',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  if (loading && !courses.length && !rooms.length) {
    return (
      <AdminLayout>
        <div className="p-8 flex flex-col items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-cyan-500 mb-4" />
          <p className="text-gray-600">Loading form data...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-6 py-8 max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center text-gray-600 hover:text-black mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Create Class Schedules</h1>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkMode(true)}
              disabled={!subjects.length || submitting}
            >
              <Copy className="h-4 w-4 mr-2" />
              Bulk Create
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={addScheduleItem}
              disabled={submitting}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Schedule
            </Button>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Course Selection</CardTitle>
              <CardDescription>Select the course for which you want to create schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="course" className={fieldErrors.course ? "text-red-500" : ""}>
                  Course <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={selectedCourseId}
                  onValueChange={setSelectedCourseId}
                  disabled={submitting}
                >
                  <SelectTrigger className={fieldErrors.course ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a course" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.map((course) => (
                      <SelectItem key={course.id} value={course.id}>
                        {course.name} - {course.branch} (Semester {course.semester})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {fieldErrors.course && <p className="text-xs text-red-500">{fieldErrors.course}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Items */}
          <div className="space-y-4">
            {scheduleItems.map((item, index) => (
              <Card key={item.id}>
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                      Schedule {index + 1}
                      {subjects.find(s => s.id === item.subjectId) && (
                        <Badge variant="outline" className="ml-2">
                          {subjects.find(s => s.id === item.subjectId)?.code}
                        </Badge>
                      )}
                    </CardTitle>
                    {scheduleItems.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeScheduleItem(item.id)}
                        disabled={submitting}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Subject Selection */}
                    <div className="space-y-2">
                      <Label className={fieldErrors[`subject-${index}`] ? "text-red-500" : ""}>
                        Subject <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={item.subjectId}
                        onValueChange={(value) => handleSubjectChange(item.id, value)}
                        disabled={!selectedCourseId || submitting || subjectsLoading}
                      >
                        <SelectTrigger className={fieldErrors[`subject-${index}`] ? "border-red-500" : ""}>
                          {subjectsLoading ? (
                            <div className="flex items-center">
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                              <span>Loading...</span>
                            </div>
                          ) : (
                            <SelectValue placeholder={!selectedCourseId ? "Select course first" : "Select subject"} />
                          )}
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>
                              {subject.code}: {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors[`subject-${index}`] && <p className="text-xs text-red-500">{fieldErrors[`subject-${index}`]}</p>}
                    </div>

                    {/* Faculty Selection */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className={fieldErrors[`faculty-${index}`] ? "text-red-500" : ""}>
                          Faculty <span className="text-red-500">*</span>
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={item.autoAssignFaculty}
                            onCheckedChange={(checked) => 
                              updateScheduleItem(item.id, 'autoAssignFaculty', !!checked)
                            }
                            disabled={submitting}
                          />
                          <label className="text-xs text-gray-500">Auto</label>
                        </div>
                      </div>
                      <Select
                        value={item.facultyId}
                        onValueChange={(value) => updateScheduleItem(item.id, 'facultyId', value)}
                        disabled={item.autoAssignFaculty || submitting}
                      >
                        <SelectTrigger className={fieldErrors[`faculty-${index}`] ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select faculty" />
                        </SelectTrigger>
                        <SelectContent>
                          {faculty.map((f) => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.name} ({f.department})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors[`faculty-${index}`] && <p className="text-xs text-red-500">{fieldErrors[`faculty-${index}`]}</p>}
                    </div>

                    {/* Room Selection */}
                    <div className="space-y-2">
                      <Label>Room (Optional)</Label>
                      <div className="flex space-x-2">
                        <Select
                          value={item.roomId}
                          onValueChange={(value) => updateScheduleItem(item.id, 'roomId', value)}
                          disabled={submitting}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select room" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No room</SelectItem>
                            {rooms.map((room) => (
                              <SelectItem key={room.id} value={room.id}>
                                {room.name} ({room.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {index === 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRoomDialogOpen(true)}
                            disabled={submitting}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Day Selection */}
                    <div className="space-y-2">
                      <Label className={fieldErrors[`day-${index}`] ? "text-red-500" : ""}>
                        Day <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={item.dayOfWeek}
                        onValueChange={(value) => updateScheduleItem(item.id, 'dayOfWeek', value)}
                        disabled={submitting}
                      >
                        <SelectTrigger className={fieldErrors[`day-${index}`] ? "border-red-500" : ""}>
                          <SelectValue placeholder="Select day" />
                        </SelectTrigger>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day} value={day}>
                              {day}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors[`day-${index}`] && <p className="text-xs text-red-500">{fieldErrors[`day-${index}`]}</p>}
                    </div>

                    {/* Start Time */}
                    <div className="space-y-2">
                      <Label className={fieldErrors[`startTime-${index}`] ? "text-red-500" : ""}>
                        Start Time <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => updateScheduleItem(item.id, 'startTime', e.target.value)}
                          className={`pl-10 ${fieldErrors[`startTime-${index}`] ? "border-red-500" : ""}`}
                          disabled={submitting}
                        />
                      </div>
                      {fieldErrors[`startTime-${index}`] && <p className="text-xs text-red-500">{fieldErrors[`startTime-${index}`]}</p>}
                    </div>

                    {/* End Time */}
                    <div className="space-y-2">
                      <Label className={fieldErrors[`endTime-${index}`] ? "text-red-500" : ""}>
                        End Time <span className="text-red-500">*</span>
                      </Label>
                      <div className="relative">
                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          type="time"
                          value={item.endTime}
                          onChange={(e) => updateScheduleItem(item.id, 'endTime', e.target.value)}
                          className={`pl-10 ${fieldErrors[`endTime-${index}`] ? "border-red-500" : ""}`}
                          disabled={submitting}
                        />
                      </div>
                      {fieldErrors[`endTime-${index}`] && <p className="text-xs text-red-500">{fieldErrors[`endTime-${index}`]}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Submit Button */}
          <CardFooter className="flex justify-between border-t bg-gray-50 p-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!isFormValid || submitting}
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating {scheduleItems.length} Schedule(s)...
                </>
              ) : (
                `Create ${scheduleItems.length} Schedule(s)`
              )}
            </Button>
          </CardFooter>
        </form>
      </div>

      {/* Bulk Creation Dialog */}
      <Dialog open={bulkMode} onOpenChange={setBulkMode}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Bulk Create Schedules</DialogTitle>
            <DialogDescription>
              Create schedules for all subjects in the selected course with sequential timing
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulkDay" className="text-right">Day</Label>
              <Select
                value={bulkSettings.dayOfWeek}
                onValueChange={(value) => setBulkSettings(prev => ({ ...prev, dayOfWeek: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {daysOfWeek.map((day) => (
                    <SelectItem key={day} value={day}>{day}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulkStartTime" className="text-right">Start Time</Label>
              <Input
                id="bulkStartTime"
                type="time"
                value={bulkSettings.startTime}
                onChange={(e) => setBulkSettings(prev => ({ ...prev, startTime: e.target.value }))
                }
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulkDuration" className="text-right">Duration (min)</Label>
              <Input
                id="bulkDuration"
                type="number"
                value={bulkSettings.duration}
                onChange={(e) => setBulkSettings(prev => ({ ...prev, duration: Number(e.target.value) }))
                }
                className="col-span-3"
                min={30}
                max={180}
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="bulkRoom" className="text-right">Room</Label>
              <Select
                value={bulkSettings.roomId}
                onValueChange={(value) => setBulkSettings(prev => ({ ...prev, roomId: value }))
                }
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No room</SelectItem>
                  {rooms.map((room) => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} ({room.type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Auto Faculty</Label>
              <div className="col-span-3">
                <Checkbox
                  checked={bulkSettings.autoAssignFaculty}
                  onCheckedChange={(checked) => setBulkSettings(prev => ({ ...prev, autoAssignFaculty: !!checked }))
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkMode(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleBulkCreate}
            >
              Create {subjects.length} Schedules
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Room Creation Dialog */}
      <Dialog open={isRoomDialogOpen} onOpenChange={setIsRoomDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create New Room</DialogTitle>
            <DialogDescription>
              Add a new classroom or lab to the system
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomName" className="text-right">
                Room Name
              </Label>
              <Input
                id="roomName"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="e.g., Room 101"
                className="col-span-3"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomType" className="text-right">
                Room Type
              </Label>
              <Select
                value={newRoomType}
                onValueChange={(value: "CLASSROOM" | "LAB") => setNewRoomType(value)}
              >
                <SelectTrigger id="roomType" className="col-span-3">
                  <SelectValue placeholder="Select room type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLASSROOM">Classroom</SelectItem>
                  <SelectItem value="LAB">Laboratory</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="roomCapacity" className="text-right">
                Capacity
              </Label>
              <Input
                id="roomCapacity"
                type="number"
                value={newRoomCapacity || ''}
                onChange={(e) => setNewRoomCapacity(Number(e.target.value))}
                className="col-span-3"
                min={1}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsRoomDialogOpen(false)}
              disabled={creatingRoom}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateRoom}
              disabled={creatingRoom}
            >
              {creatingRoom ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Room"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
