"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import NoticeForm from "@/components/admin/NoticeForm";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toastall";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function EditNoticePage() {
  const params = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/admin/notices/${id}`);
        
        if (!res.ok) {
          throw new Error('Failed to fetch notice');
        }
        
        const data = await res.json();
        setNotice(data.notice);
      } catch (error: any) {
        setError(error.message || 'An error occurred');
        toast({
          title: "Error",
          description: error.message || "Failed to load notice",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchNotice();
    }
  }, [id]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-screen">
          <LoadingSpinner message="Loading notice details..." />
        </div>
      </AdminLayout>
    );
  }

  if (error || !notice) {
    return (
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <p className="text-red-700">{error || "Notice not found"}</p>
          </div>
          <Button onClick={() => router.push('/admin/notices')}>
            Back to Notices
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/admin/notices" className="flex items-center text-cyan-600 hover:underline mb-6 gap-1">
          <ChevronLeft className="h-4 w-4" />
          <span>Back to Notices</span>
        </Link>
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Notice</h1>
          <p className="text-gray-600 mt-1">Update notice details and content</p>
        </div>
        
        <NoticeForm mode="edit" initialData={notice} />
      </div>
    </AdminLayout>
  );
}
