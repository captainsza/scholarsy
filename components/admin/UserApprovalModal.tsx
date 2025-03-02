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
import { useState } from "react";

interface UserApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  isApproved: boolean;
  onConfirm: () => void;
  userName: string;
}

export default function UserApprovalModal({
  isOpen,
  onClose,
  isApproved,
  onConfirm,
  userName,
}: UserApprovalModalProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      await onConfirm();
    } finally {
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isApproved ? "Disapprove User" : "Approve User"}
          </DialogTitle>
          <DialogDescription>
            {isApproved
              ? `Are you sure you want to disapprove ${userName}? This will restrict their access to the system.`
              : `Are you sure you want to approve ${userName}? This will grant them access to the system.`}
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          {isApproved ? (
            <div className="p-4 bg-red-50 rounded-md">
              <p className="text-sm text-red-800">
                <span className="font-bold">Warning:</span> Disapproving the user will immediately restrict their access. They will be unable to log in until approved again.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-green-50 rounded-md">
              <p className="text-sm text-green-800">
                <span className="font-bold">Note:</span> Approving this user will grant them immediate access to all features related to their role.
              </p>
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant={isApproved ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isApproved ? "Disapproving..." : "Approving...") 
              : (isApproved ? "Disapprove" : "Approve")
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
