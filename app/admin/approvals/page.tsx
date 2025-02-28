"use client";

import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import ApprovalTable from "@/components/admin/ApprovalTable";

export default function ApprovalsPage() {
  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Approvals</h1>
        </div>
        
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Pending Approval Requests</h2>
            <p className="mt-1 text-sm text-gray-500">
              Review and manage registration requests from faculty and students
            </p>
          </div>
          <ApprovalTable />
        </div>
      </div>
    </AdminLayout>
  );
}
