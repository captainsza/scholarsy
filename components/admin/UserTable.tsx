"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistance } from "date-fns";
import {
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
  MoreHorizontal,
  Edit,
  Trash2,
  UserCog,
  Shield,
  Plus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toastall";

interface UserType {
  id: string;
  email: string;
  role: string;
  isApproved: boolean;
  emailVerified: boolean;
  createdAt: string;
  profile?: {
    firstName: string;
    lastName: string;
    profileImage?: string;
  };
  student?: {
    enrollmentId: string;
    department: string;
  };
  faculty?: {
    department: string;
  };
}

interface UserTableProps {
  users: UserType[];
  loading: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onRefresh: () => void;
}

export default function UserTable({
  users,
  loading,
  currentPage,
  totalPages,
  onPageChange,
  onRefresh
}: UserTableProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserType | null>(null);
  const [deletingUser, setDeletingUser] = useState(false);
  const [approvingUser, setApprovingUser] = useState<Record<string, boolean>>({});

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      setDeletingUser(true);
      const response = await fetch(`/api/admin/users/${userToDelete.id}`, {
        method: "DELETE",
      });
      
      if (response.ok) {
        toast({
          title: "User Deleted",
          description: "The user has been successfully deleted.",
        });
        onRefresh(); // Refresh the user list
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete user");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingUser(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleApproveUser = async (user: UserType) => {
    try {
      setApprovingUser(prev => ({ ...prev, [user.id]: true }));
      
      const response = await fetch(`/api/admin/users/${user.id}/approve`, {
        method: "PATCH",
      });
      
      if (response.ok) {
        toast({
          title: "User Approved",
          description: "The user has been successfully approved.",
        });
        onRefresh(); // Refresh the user list
      } else {
        const error = await response.json();
        throw new Error(error.message || "Failed to approve user");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setApprovingUser(prev => ({ ...prev, [user.id]: false }));
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      onPageChange(newPage);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
        <span>Loading users...</span>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-4">
        <User className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No users found</h3>
        <p className="text-gray-500 mt-2 max-w-md">
          No users match your current filters. Try changing your search criteria or create a new user.
        </p>
        <Button 
          onClick={() => router.push("/admin/users/create")} 
          className="mt-4"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New User
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">User</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={user.profile?.profileImage || ''}
                        alt={`${user.profile?.firstName || ''} ${user.profile?.lastName || ''}`}
                      />
                      <AvatarFallback className="bg-indigo-100 text-indigo-600">
                        {user.profile?.firstName?.[0] || ''}
                        {user.profile?.lastName?.[0] || ''}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">
                        {user.profile?.firstName
                          ? `${user.profile.firstName} ${user.profile.lastName}`
                          : "Unnamed User"}
                      </div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                      {user.student?.enrollmentId && (
                        <div className="text-xs text-gray-500">ID: {user.student.enrollmentId}</div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                    <Badge
                    variant={
                      user.role === "ADMIN"
                      ? "destructive"
                      : user.role === "FACULTY"
                      ? "info" // Changed from "purple" to "info"
                      : "default"
                    }
                    className="uppercase text-xs"
                    >
                    {user.role}
                    </Badge>
                </TableCell>
                <TableCell>
                  {user.student?.department || user.faculty?.department || "-"}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center">
                      {user.isApproved ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-yellow-500 mr-1" />
                      )}
                      <span className="text-sm">
                        {user.isApproved ? "Approved" : "Pending Approval"}
                      </span>
                    </div>
                    <div className="flex items-center">
                      {user.emailVerified ? (
                        <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <span className="text-sm">
                        {user.emailVerified ? "Email Verified" : "Not Verified"}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {formatDistance(new Date(user.createdAt), new Date(), {
                    addSuffix: true,
                  })}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {!user.isApproved && user.emailVerified && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        onClick={() => handleApproveUser(user)}
                        disabled={approvingUser[user.id]}
                      >
                        {approvingUser[user.id] ? (
                          <>
                            <span className="animate-spin mr-1">↻</span> Approving...
                          </>
                        ) : (
                          "Approve"
                        )}
                      </Button>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => router.push(`/admin/users/${user.id}`)}
                          className="cursor-pointer"
                        >
                          <UserCog className="h-4 w-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => router.push(`/admin/users/${user.id}/edit`)}
                          className="cursor-pointer"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit User
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-red-600 cursor-pointer hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete User
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="text-sm">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this user? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {userToDelete && (
            <div className="flex items-center gap-3 py-4">
              <Avatar>
                <AvatarImage
                  src={userToDelete.profile?.profileImage || ''}
                  alt={`${userToDelete.profile?.firstName || ''} ${userToDelete.profile?.lastName || ''}`}
                />
                <AvatarFallback className="bg-indigo-100 text-indigo-600">
                  {userToDelete.profile?.firstName?.[0] || ''}
                  {userToDelete.profile?.lastName?.[0] || ''}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-semibold">
                  {userToDelete.profile?.firstName
                    ? `${userToDelete.profile.firstName} ${userToDelete.profile.lastName}`
                    : "Unnamed User"}
                </div>
                <div className="text-sm text-gray-500">{userToDelete.email}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              disabled={deletingUser}
            >
              {deletingUser ? "Deleting..." : "Delete User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
