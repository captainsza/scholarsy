import { useState } from "react";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge, BadgeVariant } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/Toast";

// Define proper interface for enrollment data
interface Student {
  id: string;
  enrollmentId: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
    }
  }
}

interface Enrollment {
  id: string;
  studentId: string;
  enrolledAt: string;
  status: string;
  student: Student;
}

interface EnrolledStudentsListProps {
  enrollments: Enrollment[];
  sectionId: string;
}

export default function EnrolledStudentsList({ enrollments, sectionId }: EnrolledStudentsListProps) {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  // Filter enrollments by search term
  const filteredEnrollments = enrollments.filter(enrollment => {
    const student = enrollment.student;
    const name = `${student.user.profile.firstName} ${student.user.profile.lastName}`.toLowerCase();
    const enrollmentId = student.enrollmentId.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return name.includes(search) || enrollmentId.includes(search);
  });
  
  // Function to update enrollment status
  const updateStatus = async (enrollmentId: string, newStatus: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sections/${sectionId}/enrollments/${enrollmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "Failed to update enrollment status");
      }
      
      toast({
        title: "Status Updated",
        description: `Student status changed to ${newStatus}`,
        variant: "success"
      });
      
      // Note: In a real app, you would update the state or refresh data
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Function to get status badge color
  const getStatusColor = (status: string): BadgeVariant => {
    switch (status) {
      case "ACTIVE": return "success";
      case "DROPPED": return "destructive";
      case "ON_HOLD": return "warning";
      case "COMPLETED": return "default";
      default: return "default";
    };
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Input
          placeholder="Search students..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-xs"
        />
        <Button 
          onClick={() => window.print()}
          variant="outline"
        >
          Print Roster
        </Button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enrollment ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enrolled On</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEnrollments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    {searchTerm ? "No matching students found" : "No students enrolled yet"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnrollments.map((enrollment) => {
                  const student = enrollment.student;
                  return (
                    <TableRow key={enrollment.id}>
                      <TableCell className="font-medium">{student.enrollmentId}</TableCell>
                      <TableCell>
                        {student.user.profile.firstName} {student.user.profile.lastName}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(enrollment.status)}>
                          {enrollment.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={loading || enrollment.status === "ACTIVE"}
                            onClick={() => updateStatus(enrollment.id, "ACTIVE")}
                          >
                            Activate
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            disabled={loading || enrollment.status === "DROPPED"}
                            onClick={() => updateStatus(enrollment.id, "DROPPED")}
                          >
                            Drop
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
