"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import FacultyLayout from "@/components/layouts/FacultyLayout";
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
  BookOpen,
  Search,
  X,
  Paperclip,
  Download
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

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

export default function FacultyNoticesPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedNotices, setExpandedNotices] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/faculty/notices");
        
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
      <FacultyLayout>
        <div className="flex items-center justify-center h-screen">
          <LoadingSpinner message="Loading notices..." />
        </div>
      </FacultyLayout>
    );
  }

  if (error) {
    return (
      <FacultyLayout>
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
      </FacultyLayout>
    );
  }

  // Filter notices based on search
  const filteredNotices = notices.filter(notice => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      notice.title.toLowerCase().includes(query) ||
      notice.content.toLowerCase().includes(query) ||
      notice.authorName.toLowerCase().includes(query)
    );
  });

  // Sort notices - pinned first, then by date
  const sortedNotices = [...filteredNotices].sort((a, b) => {
    // First by pinned status
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    
    // Then by date descending (newest first)
    return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
  });

  return (
    <FacultyLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4 mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Notices & Announcements</h1>
            
            {/* Search bar */}
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search notices..."
                className="w-full pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setSearchQuery("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <p className="text-gray-600">
            Stay updated with the latest announcements and information for faculty.
          </p>
        </div>

        {sortedNotices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchQuery ? "No matching notices found" : "No notices available"}
            </h3>
            <p className="text-gray-500 max-w-md">
              {searchQuery 
                ? "Try using different keywords or clear the search filter."
                : "There are currently no notices or announcements for faculty. Check back later for updates."
              }
            </p>
            {searchQuery && (
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setSearchQuery("")}
              >
                Clear search
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Pinned Notices */}
            {sortedNotices.some(notice => notice.isPinned) && (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Pin className="h-5 w-5 mr-2 text-blue-500" />
                  Important Announcements
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
            
            {/* Regular Notices */}
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Bell className="h-5 w-5 mr-2 text-gray-500" />
                Regular Announcements
              </h2>
              
              <div className="space-y-4">
                {sortedNotices
                  .filter(notice => !notice.isPinned)
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
          </div>
        )}
      </div>
    </FacultyLayout>
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
            
            {/* Display attachments if available */}
            {notice.attachmentUrls && notice.attachmentUrls.length > 0 && (
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attachments
                </h3>
                <div className="grid grid-cols-1 gap-2">
                  {notice.attachmentUrls.map((attachment, index) => (
                    <a
                      key={index}
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="bg-gray-100 h-8 w-8 flex items-center justify-center rounded mr-2 text-sm">
                        {getFileIcon(attachment.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {attachment.name || `Attachment ${index + 1}`}
                        </p>
                      </div>
                      <Download className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </a>
                  ))}
                </div>
              </div>
            )}
            
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
            
            {/* Show attachment indicator */}
            {notice.attachmentUrls && notice.attachmentUrls.length > 0 && (
              <div className="flex items-center mt-1.5 text-xs text-gray-500">
                <Paperclip className="h-3 w-3 mr-1" />
                <span>{notice.attachmentUrls.length} attachment{notice.attachmentUrls.length !== 1 ? 's' : ''}</span>
              </div>
            )}
            
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

// Helper to get file type icon
function getFileIcon(fileType: string): string {
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word') || fileType.includes('document')) return '📝';
  if (fileType.includes('excel') || fileType.includes('sheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📑';
  if (fileType.includes('video')) return '🎬';
  if (fileType.includes('audio')) return '🔊';
  return '📎';
}
