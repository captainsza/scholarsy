"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import StudentLayout from "@/components/layouts/StudentLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { toast } from "@/components/ui/toastall";
import { format, formatDistanceToNow } from "date-fns";
import { motion } from "framer-motion";
import { 
  Bell, 
  AlertCircle, 
  ChevronDown,
  ChevronUp,
  Pin,
  BookOpen,
  Paperclip,
  Download,
  Search,
  Calendar,
  Clock,
  Filter,
  User,
  FileText,
  X
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
  attachmentUrls: Array<{
    url: string;
    name: string;
    type: string;
  }>;
}

export default function StudentNoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "pinned" | "recent">("all");

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

  // Filter notices based on search and filter type
  const filteredNotices = notices.filter(notice => {
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notice.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    if (activeFilter === "pinned") return notice.isPinned;
    if (activeFilter === "recent") return !notice.isPinned;
    return true;
  });

  // Sort notices - pinned first, then by date
  const sortedNotices = [...filteredNotices].sort((a, b) => {
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

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-[70vh]">
          <LoadingSpinner message="Loading notices..." />
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="p-8 max-w-2xl mx-auto text-center">
          <div className="bg-red-50 p-6 rounded-lg border border-red-100">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button 
              onClick={() => window.location.reload()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Refresh page
            </Button>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg opacity-70"></div>
          <div className="relative p-6 sm:p-8 rounded-lg border border-blue-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center">
                  <Bell className="h-6 w-6 mr-2 text-blue-500" />
                  Notices & Announcements
                </h1>
                <p className="mt-2 text-gray-600 max-w-2xl">
                  Stay updated with the latest announcements, events, and information from your institution.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Badge variant="outline" className="px-3 py-1 text-sm bg-white">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {format(new Date(), "MMMM dd, yyyy")}
                </Badge>
              </div>
            </div>
            
            {/* Search and Filter Bar */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search notices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              
              <div className="flex-shrink-0">
                <Tabs 
                  value={activeFilter} 
                  onValueChange={(value) => setActiveFilter(value as "all" | "pinned" | "recent")}
                  className="w-full sm:w-auto"
                >
                  <TabsList className="w-full bg-white border">
                    <TabsTrigger value="all" className="flex-1 sm:flex-none">All</TabsTrigger>
                    <TabsTrigger value="pinned" className="flex-1 sm:flex-none">Pinned</TabsTrigger>
                    <TabsTrigger value="recent" className="flex-1 sm:flex-none">Recent</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>
          </div>
        </div>

        {notices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg border">
            <Bell className="h-16 w-16 text-gray-300 mb-6" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No notices available</h3>
            <p className="text-gray-500 max-w-md">
              There are currently no notices or announcements for you. Check back later for updates.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredNotices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg border">
                <Search className="h-16 w-16 text-gray-300 mb-6" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">No matching notices</h3>
                <p className="text-gray-500 max-w-md">
                  No notices match your current search or filter criteria.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery("");
                    setActiveFilter("all");
                  }}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              </div>
            ) : activeFilter === "all" || activeFilter === "pinned" ? (
              /* Pinned Notices */
              <div>
                {sortedNotices.some(notice => notice.isPinned) && (
                  <div>
                    <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                      <Pin className="h-5 w-5 mr-2 text-blue-500" />
                      Pinned Announcements
                    </h2>
                    <div className="space-y-4">
                      {sortedNotices
                        .filter(notice => notice.isPinned)
                        .map((notice, index) => (
                          <motion.div 
                            key={notice.id} 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.1 }}
                          >
                            <NoticeCard 
                              notice={notice}
                              isExpanded={!!expandedNotices[notice.id]}
                              onToggleExpand={() => toggleExpandNotice(notice.id)}
                            />
                          </motion.div>
                        ))
                      }
                    </div>
                  </div>
                )}
                
                {/* If in "pinned" filter mode and there are no pinned notices */}
                {activeFilter === "pinned" && !sortedNotices.some(notice => notice.isPinned) && (
                  <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg border">
                    <Pin className="h-16 w-16 text-gray-300 mb-6" />
                    <h3 className="text-xl font-medium text-gray-900 mb-2">No pinned notices</h3>
                    <p className="text-gray-500 max-w-md">
                      There are currently no pinned announcements.
                    </p>
                  </div>
                )}
              </div>
            ) : null}
            
            {/* Recent Notices by Month (only if in "all" or "recent" mode) */}
            {(activeFilter === "all" || activeFilter === "recent") && Object.entries(noticesByMonth).length > 0 && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-blue-500" />
                  Notices by Month
                </h2>
                
                <Accordion type="single" collapsible className="w-full">
                  {Object.entries(noticesByMonth).map(([month, monthNotices], index) => {
                    // In "recent" mode, only display non-pinned notices
                    const filteredMonthNotices = activeFilter === "recent" 
                      ? monthNotices.filter(notice => !notice.isPinned)
                      : monthNotices.filter(notice => !notice.isPinned); // In "all" mode, also filter out pinned as they're already shown above
                    
                    if (filteredMonthNotices.length === 0) return null;
                    
                    return (
                      <AccordionItem key={month} value={month}>
                        <AccordionTrigger className="text-base font-medium hover:bg-gray-50 px-4 rounded-md">
                          <div className="flex items-center">
                            <span>{month}</span>
                            <Badge variant="outline" className="ml-2 bg-white">
                              {filteredMonthNotices.length}
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            {filteredMonthNotices.map((notice, noticeIndex) => (
                              <motion.div 
                                key={notice.id} 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: noticeIndex * 0.1 }}
                              >
                                <NoticeCard 
                                  notice={notice}
                                  isExpanded={!!expandedNotices[notice.id]}
                                  onToggleExpand={() => toggleExpandNotice(notice.id)}
                                />
                              </motion.div>
                            ))}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>
            )}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}

// Enhanced Notice Card Component
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
    <Card className={`overflow-hidden transition-all duration-200 ${notice.isPinned ? "border-blue-200 shadow-md bg-blue-50/30" : ""}`}>
      <CardHeader className={`pb-2 ${notice.isPinned ? "bg-blue-50/50" : ""}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {notice.title}
              {notice.isPinned && (
                <Pin className="h-3.5 w-3.5 text-blue-500" />
              )}
            </CardTitle>
            <CardDescription className="flex flex-wrap gap-2 items-center text-xs">
              <span className="flex items-center">
                <Clock className="h-3 w-3 mr-1 inline" />
                {formatDistanceToNow(new Date(notice.publishDate), { addSuffix: true })}
              </span>
              <span className="text-gray-400">•</span>
              <span className="flex items-center">
                <User className="h-3 w-3 mr-1 inline" />
                {notice.authorName}
              </span>
              {notice.expiryDate && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center text-amber-600">
                    <AlertCircle className="h-3 w-3 mr-1 inline" />
                    Expires {format(new Date(notice.expiryDate), "MMM d, yyyy")}
                  </span>
                </>
              )}
            </CardDescription>
          </div>
          <button 
            onClick={onToggleExpand}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
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
      
      <CardContent className={isExpanded ? "pb-0" : ""}>
        {isExpanded ? (
          <div>
            <div className="prose prose-blue prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: notice.content }} />
            
            {/* Display attachments if available */}
            {notice.attachmentUrls && notice.attachmentUrls.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attachments
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {notice.attachmentUrls.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      download
                      className="group flex items-center p-3 border rounded-lg hover:bg-gray-50 hover:border-blue-200 transition-all"
                    >
                      <div className="bg-gray-100 h-10 w-10 flex items-center justify-center rounded-lg mr-3 text-lg group-hover:bg-blue-100 transition-colors">
                        {getFileIconEmoji(attachment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.name || `Attachment ${index + 1}`}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {formatFileSize(attachment.url)} • {getFileTypeLabel(attachment.type)}
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {notice.linkUrl && (
              <div className="mt-5 flex">
                <Button 
                  variant="outline"
                  size="sm"
                  asChild
                  className="flex items-center text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                >
                  <a 
                    href={notice.linkUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    View Related Resource
                  </a>
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div 
              className="line-clamp-2 text-gray-600 text-sm" 
              dangerouslySetInnerHTML={{ __html: notice.content }} 
            />
            
            {/* Show attachment and link indicators */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
              {notice.attachmentUrls && notice.attachmentUrls.length > 0 && (
                <span className="flex items-center">
                  <Paperclip className="h-3 w-3 mr-1" />
                  {notice.attachmentUrls.length} attachment{notice.attachmentUrls.length !== 1 ? 's' : ''}
                </span>
              )}
              
              {notice.linkUrl && (
                <span className="flex items-center">
                  <BookOpen className="h-3 w-3 mr-1" />
                  External resource
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
      
      {isExpanded && (
        <CardFooter className="flex justify-between pt-4 pb-4 bg-gray-50">
          <div className="text-xs text-gray-500 flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            Posted: {format(new Date(notice.publishDate), "MMMM d, yyyy 'at' h:mm a")}
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleExpand}>
            Collapse
          </Button>
        </CardFooter>
      )}
      
      {!isExpanded && (
        <div className="px-6 pb-4">
          <Button variant="ghost" size="sm" className="text-blue-600" onClick={onToggleExpand}>
            Read more
          </Button>
        </div>
      )}
    </Card>
  );
}

// Helper to get file type emoji (more detailed version)
function getFileIconEmoji(fileType: string): string {
  if (!fileType) return '📎';
  
  if (fileType.includes('image/')) {
    if (fileType.includes('svg')) return '🖋️';
    return '🖼️';
  }
  
  if (fileType.includes('application/pdf')) return '📄';
  
  if (fileType.includes('word') || fileType.includes('document') || 
      fileType.includes('application/msword') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml')) return '📝';
  
  if (fileType.includes('excel') || fileType.includes('sheet') || 
      fileType.includes('application/vnd.ms-excel') ||
      fileType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml')) return '📊';
  
  if (fileType.includes('powerpoint') || fileType.includes('presentation') || 
      fileType.includes('application/vnd.ms-powerpoint') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.presentationml')) return '📑';
  
  if (fileType.includes('video/')) return '🎬';
  if (fileType.includes('audio/')) return '🔊';
  if (fileType.includes('text/')) return '📄';
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('archive')) return '📦';
  
  return '📎';
}

// Helper to get file type label
function getFileTypeLabel(fileType: string): string {
  if (!fileType) return 'File';
  
  if (fileType.includes('image/')) {
    if (fileType.includes('png')) return 'PNG Image';
    if (fileType.includes('jpeg') || fileType.includes('jpg')) return 'JPEG Image';
    if (fileType.includes('gif')) return 'GIF Image';
    if (fileType.includes('svg')) return 'SVG Image';
    return 'Image';
  }
  
  if (fileType.includes('application/pdf')) return 'PDF Document';
  
  if (fileType.includes('msword') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.wordprocessingml')) 
    return 'Word Document';
  
  if (fileType.includes('application/vnd.ms-excel') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml')) 
    return 'Excel Spreadsheet';
  
  if (fileType.includes('application/vnd.ms-powerpoint') || 
      fileType.includes('application/vnd.openxmlformats-officedocument.presentationml')) 
    return 'PowerPoint Presentation';
  
  if (fileType.includes('video/')) {
    if (fileType.includes('mp4')) return 'MP4 Video';
    return 'Video';
  }
  
  if (fileType.includes('audio/')) {
    if (fileType.includes('mp3')) return 'MP3 Audio';
    return 'Audio';
  }
  
  if (fileType.includes('text/')) {
    if (fileType.includes('html')) return 'HTML Document';
    if (fileType.includes('csv')) return 'CSV File';
    return 'Text File';
  }
  
  if (fileType.includes('zip')) return 'ZIP Archive';
  if (fileType.includes('rar')) return 'RAR Archive';
  
  // Extract extension from mime type if possible
  const parts = fileType.split('/');
  if (parts.length > 1) {
    return parts[1].toUpperCase() + ' File';
  }
  
  return 'File';
}

// Helper to estimate file size from URL
// This is a placeholder - in a real app, the file size would come from the backend
function formatFileSize(url: string): string {
  // This is a dummy function that simulates file size
  // In a real app, the file size would be provided by the backend
  const hash = url.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Generate a pseudo-random size between 10KB and 8MB based on URL hash
  const size = Math.abs(hash % 8000000) + 10000;
  
  if (size < 1000000) {
    return `${Math.round(size / 1024)} KB`;
  } else {
    return `${(size / 1048576).toFixed(1)} MB`;
  }
}
