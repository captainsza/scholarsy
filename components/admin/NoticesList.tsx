"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { format, formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toastall';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Search,
  Plus,
  MoreHorizontal,
  Pin,
  PinOff,
  Eye,
  PenSquare,
  Trash2,
  Filter,
  Paperclip
} from 'lucide-react';

interface Notice {
  id: string;
  title: string;
  content: string;
  publishDate: string;
  expiryDate?: string;
  isPinned: boolean;
  isPublished: boolean;
  targetType: string;
  authorName: string;
  attachmentUrls: string[];
}

export default function NoticesList() {
  const router = useRouter();
  
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  useEffect(() => {
    fetchNotices();
  }, []);
  
  const fetchNotices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const res = await fetch('/api/admin/notices');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch notices');
      }
      
      const data = await res.json();
      setNotices(data.notices || []);
    } catch (error: any) {
      console.error('Error fetching notices:', error);
      setError(error.message || 'Failed to load notices');
      toast({
        title: 'Error',
        description: error.message || 'Failed to load notices',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTogglePin = async (id: string, currentPinned: boolean) => {
    try {
      const res = await fetch(`/api/admin/notices/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPinned: !currentPinned }),
      });
      
      if (res.ok) {
        setNotices(notices.map(notice => 
          notice.id === id ? { ...notice, isPinned: !notice.isPinned } : notice
        ));
        
        toast({
          title: `Notice ${currentPinned ? 'unpinned' : 'pinned'}`,
          variant: 'default',
        });
      } else {
        throw new Error('Failed to update notice');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update notice status',
        variant: 'destructive',
      });
    }
  };
  
  const handleDeleteNotice = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    
    try {
      const res = await fetch(`/api/admin/notices/${id}`, {
        method: 'DELETE',
      });
      
      if (res.ok) {
        setNotices(notices.filter(notice => notice.id !== id));
        toast({
          title: 'Notice deleted',
          variant: 'default',
        });
      } else {
        throw new Error('Failed to delete notice');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notice',
        variant: 'destructive',
      });
    }
  };
  
  // Helper to parse attachment URLs
  const getAttachments = (attachmentUrls: string[]) => {
    if (!attachmentUrls || attachmentUrls.length === 0) return [];
    
    return attachmentUrls.map(attachment => {
      try {
        return JSON.parse(attachment);
      } catch (e) {
        // Handle legacy format or parse errors
        return {
          name: "Attachment",
          type: "application/octet-stream",
          url: attachment
        };
      }
    });
  };

  // Filter notices based on search and status
  const filteredNotices = notices.filter(notice => {
    // Search filter
    const matchesSearch = notice.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        notice.content.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Status filter
    let matchesStatus = true;
    if (statusFilter === 'published') {
      matchesStatus = notice.isPublished;
    } else if (statusFilter === 'unpublished') {
      matchesStatus = !notice.isPublished;
    } else if (statusFilter === 'pinned') {
      matchesStatus = notice.isPinned;
    } else if (statusFilter === 'expired') {
      matchesStatus = notice.expiryDate 
        ? new Date(notice.expiryDate) < new Date() 
        : false;
    }
    
    return matchesSearch && matchesStatus;
  });

  if (error) {
    return (
      <div className="py-8 bg-red-50 text-center rounded-md">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={fetchNotices} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input 
            placeholder="Search notices..." 
            className="pl-10"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex flex-shrink-0 gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                {statusFilter === 'all' ? 'All' : 
                 statusFilter === 'published' ? 'Published' :
                 statusFilter === 'unpublished' ? 'Unpublished' :
                 statusFilter === 'pinned' ? 'Pinned' : 'Expired'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                All Notices
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('published')}>
                Published
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('unpublished')}>
                Unpublished
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('pinned')}>
                Pinned
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('expired')}>
                Expired
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={() => router.push('/admin/notices/create')}>
            <Plus className="h-4 w-4 mr-2" />
            New Notice
          </Button>
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[300px]">Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Target</TableHead>
              <TableHead>Published</TableHead>
              <TableHead>Expires</TableHead>
              <TableHead>Author</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <div className="flex flex-col items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-gray-500 mb-2"></div>
                    <span className="text-gray-500">Loading notices...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredNotices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <p className="text-gray-500">No notices found</p>
                  {searchQuery && (
                    <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredNotices.map((notice) => {
                // Parse attachments
                const attachments = getAttachments(notice.attachmentUrls);
                
                return (
                  <TableRow key={notice.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        {notice.isPinned && (
                          <Pin className="h-4 w-4 mr-2 text-blue-500" />
                        )}
                        <div>
                          <span className="line-clamp-1">{notice.title}</span>
                          {attachments.length > 0 && (
                            <div className="flex items-center mt-1 text-xs text-gray-500">
                              <Paperclip className="h-3 w-3 mr-1" />
                              <span>{attachments.length} attachment{attachments.length !== 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {notice.isPublished ? (
                        <Badge variant="success">Published</Badge>
                      ) : (
                        <Badge variant="warning">Draft</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{notice.targetType}</Badge>
                    </TableCell>
                    <TableCell>
                      <span title={format(new Date(notice.publishDate), 'PPpp')}>
                        {formatDistanceToNow(new Date(notice.publishDate), { addSuffix: true })}
                      </span>
                    </TableCell>
                    <TableCell>
                      {notice.expiryDate ? (
                        <span title={format(new Date(notice.expiryDate), 'PPpp')}>
                          {formatDistanceToNow(new Date(notice.expiryDate), { addSuffix: true })}
                        </span>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell>{notice.authorName}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/admin/notices/view/${notice.id}`)}>
                            <Eye className="h-4 w-4 mr-2" />
                            <span>View</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/admin/notices/edit/${notice.id}`)}>
                            <PenSquare className="h-4 w-4 mr-2" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleTogglePin(notice.id, notice.isPinned)}>
                            {notice.isPinned ? (
                              <>
                                <PinOff className="h-4 w-4 mr-2" />
                                <span>Unpin</span>
                              </>
                            ) : (
                              <>
                                <Pin className="h-4 w-4 mr-2" />
                                <span>Pin</span>
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteNotice(notice.id)} className="text-red-600">
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span>Delete</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
