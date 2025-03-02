import { useState, ChangeEvent, FormEvent } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toastall";

// Define proper types for props and state
interface Room {
  id: string;
  name: string;
  capacity: number;
  type: string;
}

interface Schedule {
  id: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: Room;
}

interface ScheduleFormData {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  roomId: string;
}

interface SchedulesListProps {
  schedules: Schedule[];
  sectionId: string;
}

export default function SchedulesList({ schedules, sectionId }: SchedulesListProps) {
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState<ScheduleFormData>({
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    roomId: ""
  });
  const [rooms, setRooms] = useState<Room[]>([]);
  
  // Function to fetch rooms when dialog opens
  const fetchRooms = async (): Promise<void> => {
    try {
      const response = await fetch("/api/admin/rooms");
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const data = await response.json();
      setRooms(data.rooms);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load rooms",
        variant: "destructive"
      });
    }
  };
  
  const handleOpenDialog = (): void => {
    setIsDialogOpen(true);
    fetchRooms();
  };
  
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    try {
      setLoading(true);
      
      // Validate form data
      if (!formData.dayOfWeek || !formData.startTime || !formData.endTime) {
        toast({
          title: "Validation Error",
          description: "Please fill all required fields",
          variant: "destructive"
        });
        return;
      }
      
      const response = await fetch(`/api/admin/sections/${sectionId}/schedules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to create schedule");
      }

      toast({
        title: "Success",
        description: "Class schedule added successfully",
        variant: "success"
      });
      
      // Close dialog and reset form
      setIsDialogOpen(false);
      setFormData({
        dayOfWeek: "",
        startTime: "",
        endTime: "",
        roomId: ""
      });
      
      // In a real app, you would update the schedules state or refetch data
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create schedule",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Format time from "HH:MM" to "HH:MM AM/PM"
  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return timeString; // Return original if parsing fails
    }
  };
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={handleOpenDialog}>
          Add Class Schedule
        </Button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Day</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schedules?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No schedules added for this section yet
                  </TableCell>
                </TableRow>
              ) : (
                schedules?.map((schedule) => (
                  <TableRow key={schedule.id}>
                    <TableCell>{schedule.dayOfWeek}</TableCell>
                    <TableCell>{formatTime(schedule.startTime)}</TableCell>
                    <TableCell>{formatTime(schedule.endTime)}</TableCell>
                    <TableCell>{schedule.room?.name || 'No room assigned'}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => {
                            // Implement edit functionality
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => {
                            // Implement delete functionality
                          }}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add Schedule Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Class Schedule</DialogTitle>
            <DialogDescription>
              Create a new class schedule for this section.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label htmlFor="dayOfWeek" className="block text-sm font-medium text-gray-700">
                Day of Week
              </label>
              <Select
                name="dayOfWeek"
                value={formData.dayOfWeek}
                onValueChange={(value) => setFormData(prev => ({ ...prev, dayOfWeek: value }))}
                required
           
              >
                <option value="">Select Day</option>
                <option value="Monday">Monday</option>
                <option value="Tuesday">Tuesday</option>
                <option value="Wednesday">Wednesday</option>
                <option value="Thursday">Thursday</option>
                <option value="Friday">Friday</option>
                <option value="Saturday">Saturday</option>
                <option value="Sunday">Sunday</option>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="startTime" className="block text-sm font-medium text-gray-700">
                  Start Time
                </label>
                <Input
                  id="startTime"
                  name="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="endTime" className="block text-sm font-medium text-gray-700">
                  End Time
                </label>
                <Input
                  id="endTime"
                  name="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="roomId" className="block text-sm font-medium text-gray-700">
                Room
              </label>
              <Select
                name="roomId"
                value={formData.roomId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, roomId: value }))}
    
              >
                <option value="">Select Room (Optional)</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name} ({room.capacity} capacity)
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Adding..." : "Add Schedule"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}