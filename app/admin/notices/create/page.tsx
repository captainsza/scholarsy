"use client";

import AdminLayout from "@/components/layouts/AdminLayout";
import NoticeForm from "@/components/admin/NoticeForm";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function CreateNoticePage() {
  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin/notices" className="flex items-center text-cyan-600 hover:underline mb-6 gap-1">
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Notices</span>
        </Link>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create Notice</h1>
          <p className="text-gray-600 mt-1">Create a new notice for students, faculty, or staff</p>
        </div>
        
        <NoticeForm mode="create" />
      </div>
    </AdminLayout>
  );
}
