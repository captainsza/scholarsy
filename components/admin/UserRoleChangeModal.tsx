"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface UserRoleChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRole: string;
  onConfirm: (newRole: string) => void;
  userName: string;
}

export default function UserRoleChangeModal({
  isOpen,
  onClose,
  currentRole,
  onConfirm,
  userName,
}: UserRoleChangeModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>(currentRole);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleConfirm = async () => {
    if (selectedRole !== currentRole) {
      setIsSubmitting(true);
      await onConfirm(selectedRole);
      setIsSubmitting(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
          <DialogDescription>
            Update the role for {userName}. This will change the user's permissions and access level.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm font-medium mb-2">Current Role: <span className="font-bold">{currentRole}</span></p>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a new role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="STUDENT">Student</SelectItem>
              <SelectItem value="FACULTY">Faculty</SelectItem>
              <SelectItem value="ADMIN">Administrator</SelectItem>
            </SelectContent>
          </Select>
          
          {selectedRole !== currentRole && (
            <div className="mt-4 p-4 bg-amber-50 rounded-md">
              <p className="text-sm text-amber-800">
                <span className="font-bold">Warning:</span> Changing a user's role may affect their access and may require additional profile information.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={selectedRole === currentRole || isSubmitting}
          >
            {isSubmitting ? "Updating..." : "Update Role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
