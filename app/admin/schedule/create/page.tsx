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
import { AlertCircle, ArrowLeft, Calendar, Clock, Loader2, Plus } from "lucide-react";
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
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const [subjectsLoading, setSubjectsLoading] = useState(false);

  // Faculty data
  const [faculty, setFaculty] = useState<any[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState<string>("");
  const [autoAssignFaculty, setAutoAssignFaculty] = useState<boolean>(true);

  // Room data
  const [rooms, setRooms] = useState<any[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string>("none");

  // Room creation state
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [newRoomType, setNewRoomType] = useState<"CLASSROOM" | "LAB">("CLASSROOM");
  const [newRoomCapacity, setNewRoomCapacity] = useState<number>(30);
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Schedule data
  const [dayOfWeek, setDayOfWeek] = useState<string>("Monday");
  const [startTime, setStartTime] = useState<string>("09:00");
  const [endTime, setEndTime] = useState<string>("10:00");

  // Form valid state
  const [isFormValid, setIsFormValid] = useState<boolean>(false);

  // Field error states
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
        setSelectedSubjectId('');
        return;
      }

      try {
        setSubjectsLoading(true);
        const res = await fetch(`/api/admin/courses/${selectedCourseId}/subjects`);
        if (!res.ok) throw new Error('Failed to fetch subjects');

        const data = await res.json();
        setSubjects(data.subjects || []);

        // Reset selected subject
        setSelectedSubjectId('');

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

  // Auto-select faculty when subject is selected and auto-assign is enabled
  useEffect(() => {
    if (autoAssignFaculty && selectedSubjectId) {
      const selectedSubject = subjects.find(s => s.id === selectedSubjectId);
      if (selectedSubject && selectedSubject.facultyId) {
        setSelectedFacultyId(selectedSubject.facultyId);
      } else {
        // If no faculty is assigned to this subject, reset the selection
        setSelectedFacultyId('');
      }
    }
  }, [selectedSubjectId, subjects, autoAssignFaculty]);

  // Validate form - update to make room optional
  useEffect(() => {
    const newFieldErrors: Record<string, string> = {};

    if (!selectedCourseId) newFieldErrors.course = "Course is required";
    if (!selectedSubjectId) newFieldErrors.subject = "Subject is required";
    if (!selectedFacultyId) newFieldErrors.faculty = "Faculty is required";
    if (!dayOfWeek) newFieldErrors.dayOfWeek = "Day is required";
    if (!startTime) newFieldErrors.startTime = "Start time is required";
    if (!endTime) newFieldErrors.endTime = "End time is required";

    // Check if end time is after start time
    if (startTime && endTime && startTime >= endTime) {
      newFieldErrors.endTime = "End time must be after start time";
    }

    setFieldErrors(newFieldErrors);
    setIsFormValid(Object.keys(newFieldErrors).length === 0);
  }, [selectedCourseId, selectedSubjectId, selectedFacultyId, dayOfWeek, startTime, endTime]);

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

      // Add new room to list and select it
      setRooms(prevRooms => [...prevRooms, newRoom.room]);
      setSelectedRoomId(newRoom.room.id);

      toast({
        title: "Success",
        description: "Room created successfully",
      });

      // Reset and close dialog
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
      const roomIdToSubmit = selectedRoomId === "none" ? null : selectedRoomId;

      const scheduleData = {
        courseId: selectedCourseId,
        subjectId: selectedSubjectId,
        facultyId: selectedFacultyId,
        dayOfWeek,
        startTime,
        endTime,
        ...(selectedRoomId !== "none" && { roomId: selectedRoomId })
      };

      const res = await fetch('/api/admin/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(scheduleData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create schedule');
      }

      toast({
        title: 'Success',
        description: 'Schedule created successfully',
      });

      // Navigate back to schedule list
      router.push('/admin/schedule');

    } catch (err: any) {
      console.error('Error creating schedule:', err);
      setError(err.message || 'Failed to create schedule');
      toast({
        title: 'Error',
        description: err.message || 'Failed to create schedule',
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
      <div className="px-6 py-8 max-w-5xl mx-auto">
        <div className="mb-6 flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="flex items-center text-gray-600 hover:text-black mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Class Schedule</h1>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="shadow-md">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5 text-cyan-600" />
              Schedule Details
            </CardTitle>
            <CardDescription>
              Create a new class schedule by providing the details below
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Course Selection */}
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

                {/* Room Selection - Updated to be optional */}
                <div className="space-y-2">
                  <Label htmlFor="room">
                    Room <span className="text-gray-400">(Optional)</span>
                  </Label>
                  <div className="flex space-x-2">
                    <Select
                      value={selectedRoomId}
                      onValueChange={setSelectedRoomId}
                      disabled={submitting}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a room or leave empty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No room assigned</SelectItem>
                        {rooms.map((room) => (
                          <SelectItem key={room.id} value={room.id}>
                            {room.name} ({room.type}, Capacity: {room.capacity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsRoomDialogOpen(true)}
                      disabled={submitting}
                    >
                      <Plus className="h-4 w-4 mr-1" /> New
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500">Schedule can be created without assigning a room</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Subject Selection */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className={fieldErrors.subject ? "text-red-500" : ""}>
                    Subject <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={selectedSubjectId}
                    onValueChange={setSelectedSubjectId}
                    disabled={!selectedCourseId || submitting || subjectsLoading}
                  >
                    <SelectTrigger className={fieldErrors.subject ? "border-red-500" : ""}>
                      {subjectsLoading ? (
                        <div className="flex items-center">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          <span>Loading subjects...</span>
                        </div>
                      ) : (
                        <SelectValue placeholder={!selectedCourseId ? "Select a course first" : "Select a subject"} />
                      )}
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.length ? (
                        subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.code}: {subject.name}
                          </SelectItem>
                        ))
                      ) : (
                        <div className="p-2 text-sm text-gray-500">
                          {selectedCourseId ? "No subjects found for this course" : "Select a course to load subjects"}
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                  {fieldErrors.subject && <p className="text-xs text-red-500">{fieldErrors.subject}</p>}
                </div>

                {/* Faculty Selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="faculty" className={fieldErrors.faculty ? "text-red-500" : ""}>
                      Faculty <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="autoAssign"
                        checked={autoAssignFaculty}
                        onCheckedChange={(checked) => {
                          setAutoAssignFaculty(!!checked);
                          if (!checked && selectedSubjectId) {
                            setSelectedFacultyId('');
                          }
                        }}
                        disabled={submitting}
                      />
                      <label htmlFor="autoAssign" className="text-sm text-gray-500 cursor-pointer">
                        Auto-assign from subject
                      </label>
                    </div>
                  </div>
                  <Select
                    value={selectedFacultyId}
                    onValueChange={setSelectedFacultyId}
                    disabled={autoAssignFaculty || submitting}
                  >
                    <SelectTrigger className={fieldErrors.faculty ? "border-red-500" : ""}>
                      <SelectValue placeholder={
                        autoAssignFaculty
                          ? (selectedFacultyId
                              ? faculty.find(f => f.id === selectedFacultyId)?.name || "Auto-assigned faculty"
                              : "Will auto-assign when subject is selected")
                          : "Select a faculty"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {faculty.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} ({f.department})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldErrors.faculty && <p className="text-xs text-red-500">{fieldErrors.faculty}</p>}
                  {autoAssignFaculty && !selectedFacultyId && selectedSubjectId && (
                    <p className="text-xs text-amber-600">No faculty assigned to this subject</p>
                  )}
                </div>
              </div>

              {/* Schedule Time Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dayOfWeek" className={fieldErrors.dayOfWeek ? "text-red-500" : ""}>
                    Day of Week <span className="text-red-500">*</span>
                  </Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek} disabled={submitting}>
                    <SelectTrigger className={fieldErrors.dayOfWeek ? "border-red-500" : ""}>
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
                  {fieldErrors.dayOfWeek && <p className="text-xs text-red-500">{fieldErrors.dayOfWeek}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime" className={fieldErrors.startTime ? "text-red-500" : ""}>
                    Start Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="startTime"
                      type="time"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className={`pl-10 ${fieldErrors.startTime ? "border-red-500" : ""}`}
                      required
                      disabled={submitting}
                    />
                  </div>
                  {fieldErrors.startTime && <p className="text-xs text-red-500">{fieldErrors.startTime}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endTime" className={fieldErrors.endTime ? "text-red-500" : ""}>
                    End Time <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      id="endTime"
                      type="time"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className={`pl-10 ${fieldErrors.endTime ? "border-red-500" : ""}`}
                      required
                      disabled={submitting}
                    />
                  </div>
                  {fieldErrors.endTime && <p className="text-xs text-red-500">{fieldErrors.endTime}</p>}
                </div>
              </div>
            </CardContent>

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
                    Creating...
                  </>
                ) : (
                  'Create Schedule'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

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
