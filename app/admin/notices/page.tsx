"use client";

import { useState } from 'react';
import AdminLayout from "@/components/layouts/AdminLayout";
import NoticesList from "@/components/admin/NoticesList";

export default function NoticesManagementPage() {
  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notices Management</h1>
          <p className="text-gray-600 mt-1">Create and manage notices for students, faculty, and staff</p>
        </div>
        <NoticesList />
      </div>
    </AdminLayout>
  );
}