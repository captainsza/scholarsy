"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Search, MoreHorizontal, UserCheck, UserX, Pencil } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/Toast";

interface UserTableProps {
  role: string; // can be "all", "STUDENT", "FACULTY", "ADMIN"
  pendingOnly?: boolean;
}

export default function UserTable({ role, pendingOnly = false }: UserTableProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [processingActions, setProcessingActions] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        
        // Build the query parameters
        const queryParams = new URLSearchParams();
        if (role !== "all") queryParams.append("role", role);
        if (pendingOnly) queryParams.append("pendingOnly", "true");
        
        const response = await fetch(`/api/admin/users?${queryParams.toString()}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        
        const data = await response.json();
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        toast({
          title: "Error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [role, pendingOnly, toast]);

  // Filter users based on search term
  const filteredUsers = searchTerm.trim() === ""
    ? users
    : users.filter((user) => {
        const fullName = `${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`.toLowerCase();
        return (
          fullName.includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.student?.enrollmentId && user.student.enrollmentId.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      });

  const handleApproveUser = async (userId: string) => {
    await handleUserAction(userId, "approve");
  };

  const handleRejectUser = async (userId: string) => {
    await handleUserAction(userId, "reject");
  };

  const handleUserAction = async (userId: string, action: "approve" | "reject") => {
    try {
      setProcessingActions((prev) => ({ ...prev, [userId]: true }));
      
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: action === "approve" }),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }
      
      // Update the users list - either remove or update the user
      if (pendingOnly) {
        setUsers((users) => users.filter((user) => user.id !== userId));
      } else {
        setUsers((users) =>
          users.map((user) =>
            user.id === userId ? { ...user, isApproved: action === "approve" } : user
          )
        );
      }
      
      toast({
        title: action === "approve" ? "User Approved" : "User Rejected",
       
      });
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast({
        title: "Error",
        
        variant: "destructive",
      });
    } finally {
      setProcessingActions((prev) => ({ ...prev, [userId]: false }));
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "STUDENT":
        return <Badge variant="default">Student</Badge>;
      case "FACULTY":
        return <Badge variant="default">Faculty</Badge>;
      case "ADMIN":
        return <Badge variant="outline">Admin</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="relative w-full max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Search users..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="text-sm text-gray-500 hidden sm:block">
          {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          {filteredUsers.length === 0 && !loading && (
            <TableCaption>No users found.</TableCaption>
          )}
          
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-current border-t-transparent text-blue-600"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading users...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium mr-3">
                        {user.profile?.firstName?.[0] || ''}
                        {user.profile?.lastName?.[0] || ''}
                      </div>
                      <div>
                        <div className="font-medium">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                        {user.role === "STUDENT" && user.student?.enrollmentId && (
                          <div className="text-xs text-gray-500">ID: {user.student.enrollmentId}</div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  
                  <TableCell>{renderRoleBadge(user.role)}</TableCell>
                  
                  <TableCell>
                    {user.role === "STUDENT" && user.student?.department ? (
                      user.student.department
                    ) : user.role === "FACULTY" && user.faculty?.department ? (
                      user.faculty.department
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <Badge 
                      variant={user.isApproved ? "success" : "destructive"} 
                      className="font-normal"
                    >
                      {user.isApproved ? "Approved" : "Pending"}
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                  </TableCell>
                  
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      {!user.isApproved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleApproveUser(user.id)}
                          disabled={processingActions[user.id]}
                          className="h-8 w-8 p-0"
                          title="Approve"
                        >
                          <UserCheck className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {user.isApproved && pendingOnly && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRejectUser(user.id)}
                          disabled={processingActions[user.id]}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-900 hover:bg-transparent"
                          title="Reject"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                        className="h-8 w-8 p-0"
                        title="Edit"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => router.push(`/admin/users/${user.id}`)}
                          >
                            View details
                          </DropdownMenuItem>
                          {user.isApproved && (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleRejectUser(user.id)}
                            >
                              Disapprove
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
