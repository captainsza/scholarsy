"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";
import { format } from "date-fns";
import { 
  Bell, 
  AlertCircle, 
  ChevronDown,
  ChevronUp,
  Pin,
  BookOpen
} from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// Types
interface Notice {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  expiryDate?: string;
  isPinned: boolean;
  isPublished: boolean;
  authorName: string;
  linkUrl?: string;
}

export default function StudentNoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/student/notices");
        
        if (!res.ok) {
          throw new Error(`Error: ${res.status}`);
        }
        
        const data = await res.json();
        setNotices(data.notices || []);
      } catch (error) {
        console.error("Failed to fetch notices:", error);
        setError("Failed to load notices. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load notices. Please try refreshing the page.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchNotices();
  }, []);
  
  const toggleExpandNotice = (id: string) => {
    setExpandedNotices(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner message="Loading notices..." />
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="p-8 max-w-2xl mx-auto text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Refresh page
          </button>
        </div>
      </StudentLayout>
    );
  }

  // Sort notices - pinned first, then by date
  const sortedNotices = [...notices].sort((a, b) => {
    // First by pinned status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by date descending (newest first)
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });
  
  // Group notices by month
  const noticesByMonth: Record<string, Notice[]> = {};
  
  sortedNotices.forEach(notice => {
    const date = new Date(notice.publishDate);
    const monthYear = format(date, "MMMM yyyy");
    
    if (!noticesByMonth[monthYear]) {
      noticesByMonth[monthYear] = [];
    }
    
    noticesByMonth[monthYear].push(notice);
  });

  return (
    <StudentLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Notices & Announcements</h1>
          <p className="text-gray-600">
            Stay updated with the latest announcements and information.
          </p>
        </div>

        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No notices available</h3>
            <p className="text-gray-500 max-w-md">
              There are currently no notices or announcements for you. Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Pinned Notices */}
            {sortedNotices.some(notice => notice.isPinned) && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Pin className="h-5 w-5 mr-2 text-blue-500" />
                  Pinned Announcements
                </h2>
                <div className="space-y-4">
                  {sortedNotices
                    .filter(notice => notice.isPinned)
                    .map(notice => (
                      <NoticeCard 
                        key={notice.id}
                        notice={notice}
                        isExpanded={!!expandedNotices[notice.id]}
                        onToggleExpand={() => toggleExpandNotice(notice.id)}
                      />
                    ))
                  }
                </div>
              </div>
            )}
            
            {/* Recent Notices */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-gray-500" />
                Recent Announcements
              </h2>
              
              <Accordion type="single" collapsible className="w-full">
                {Object.entries(noticesByMonth).map(([month, monthNotices], index) => (
                  <AccordionItem key={month} value={month}>
                    <AccordionTrigger className="text-base font-medium">
                      {month}
                      <Badge variant="outline" className="ml-2">
                        {monthNotices.length}
                      </Badge>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-2">
                        {monthNotices
                          .filter(notice => !notice.isPinned) // Exclude pinned notices
                          .map(notice => (
                            <NoticeCard 
                              key={notice.id}
                              notice={notice}
                              isExpanded={!!expandedNotices[notice.id]}
                              onToggleExpand={() => toggleExpandNotice(notice.id)}
                            />
                          ))
                        }
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

// Notice Card Component
function NoticeCard({ 
  notice, 
  isExpanded, 
  onToggleExpand 
}: { 
  notice: Notice, 
  isExpanded: boolean, 
  onToggleExpand: () => void 
}) {
  return (
    <Card className={notice.isPinned ? "border-blue-300 shadow-md" : ""}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {notice.title}
              {notice.isPinned && (
                <Pin className="h-3.5 w-3.5 text-blue-500" />
              )}
            </CardTitle>
            <CardDescription>
              Posted on {format(new Date(notice.publishDate), "MMM d, yyyy")}
              {notice.expiryDate && (
                <span className="ml-2">
                  • Expires {format(new Date(notice.expiryDate), "MMM d, yyyy")}
                </span>
              )}
            </CardDescription>
          </div>
          <button 
            onClick={onToggleExpand}
            className="p-2 rounded-full hover:bg-gray-100"
            aria-label={isExpanded ? "Collapse notice" : "Expand notice"}
          >
            {isExpanded ? (
              <ChevronUp className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-500" />
            )}
          </button>
        </div>
      </CardHeader>
      
      <CardContent>
        {isExpanded ? (
          <div>
            <div 
              className="prose prose-sm max-w-none" 
              dangerouslySetInnerHTML={{ __html: notice.content }} 
            />
            
            {notice.linkUrl && (
              <div className="mt-4 flex">
                <a 
                  href={notice.linkUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <BookOpen className="h-4 w-4 mr-1" />
                  <span>View Resource</span>
                </a>
              </div>
            )}
            
            <div className="mt-4 text-sm text-gray-500 text-right">
              Posted by {notice.authorName}
            </div>
          </div>
        ) : (
          <div>
            <div 
              className="line-clamp-2 text-gray-600 text-sm" 
              dangerouslySetInnerHTML={{ __html: notice.content }} 
            />
            <button
              onClick={onToggleExpand}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Read more
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
