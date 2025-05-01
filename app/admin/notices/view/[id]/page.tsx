"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toastall";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import {
  ChevronLeft,
  Calendar,
  Clock,
  PenSquare,
  Users,
  Pin,
  Paperclip,
  ExternalLink,
  Download
} from "lucide-react";
import { format } from "date-fns";

interface Attachment {
  url: string;
  name: string;
  type: string;
}

interface Notice {
  id: string;
  title: string;
  content: string;
  authorName: string;
  publishDate: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  isPinned: boolean;
  targetType: string;
  targetCourseIds?: string[];
  targetDepartments?: string[];
  targetUserRoles?: string[];
  authorRole: string;
  attachmentUrls: string[];
  linkUrl?: string;
}

export default function ViewNoticePage() {
  const params = useParams();
  const router = useRouter();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);

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
        
        // Process attachments
        if (data.notice.attachmentUrls && data.notice.attachmentUrls.length > 0) {
          const processedAttachments = data.notice.attachmentUrls.map((attachment: string) => {
            try {
              return JSON.parse(attachment);
            } catch (e) {
              // Handle legacy format
              return {
                url: attachment,
                name: "Attachment",
                type: "application/octet-stream"
              };
            }
          });
          setAttachments(processedAttachments);
        }
      } catch (error: any) {
        console.error("Error fetching notice:", error);
        setError(error.message || "Failed to load notice");
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

  // Helper function to get icon by file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
    return '📎';
  };

  // Function to get file extension from URL or name
  const getFileExtension = (url: string, name: string) => {
    if (name && name.includes('.')) {
      return name.split('.').pop()?.toUpperCase();
    }
    
    if (url) {
      const urlParts = url.split('.');
      if (urlParts.length > 1) {
        return urlParts.pop()?.split('?')[0].toUpperCase();
      }
    }
    
    return 'FILE';
  };

  // Loading state
  if (loading) {
    return (
      <AdminLayout>
        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center mb-6">
            <Button variant="ghost" onClick={() => router.back()} className="mr-4">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back
            </Button>
            <Skeleton className="h-8 w-64" />
          </div>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-5 w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    );
  }

  // Error state
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" onClick={() => router.push('/admin/notices')} className="mr-4">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Notices
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">View Notice</h1>
          </div>
          <div>
            <Button variant="outline" className="mr-2" onClick={() => router.push(`/admin/notices/edit/${notice.id}`)}>
              <PenSquare className="mr-2 h-4 w-4" /> Edit
            </Button>
          </div>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl">{notice.title}</CardTitle>
              <div className="flex items-center space-x-2">
                {notice.isPinned && (
                  <Badge variant="secondary">
                    <Pin className="h-3 w-3 mr-1" /> Pinned
                  </Badge>
                )}
                <Badge variant={notice.isPublished ? "default" : "secondary"}>
                  {notice.isPublished ? "Published" : "Draft"}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-500 mt-2">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-1" />
                Published: {format(new Date(notice.publishDate), "PPP")}
              </div>
              {notice.expiryDate && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Expires: {format(new Date(notice.expiryDate), "PPP")}
                </div>
              )}
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                Audience: {notice.targetType}
              </div>
              <div>
                By {notice.authorName}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: notice.content }} />
            
            {/* External Link */}
            {notice.linkUrl && (
              <div className="mt-6 border-t pt-4">
                <a 
                  href={notice.linkUrl}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {notice.linkUrl}
                </a>
              </div>
            )}
            
            {/* Attachments */}
            {attachments.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attachments ({attachments.length})
                </h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {attachments.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="bg-gray-100 h-10 w-10 flex items-center justify-center rounded mr-3 text-xl">
                        {getFileIcon(attachment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.name || `Attachment ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {getFileExtension(attachment.url, attachment.name)}
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="border-t pt-4">
            <div className="text-xs text-gray-500">
              Created: {format(new Date(notice.createdAt), "PPp")}
              {notice.updatedAt !== notice.createdAt && (
                <> · Last updated: {format(new Date(notice.updatedAt), "PPp")}</>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </AdminLayout>
  );
}
