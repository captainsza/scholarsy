"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layouts/AdminLayout";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { 
  Bell, 
  PenLine, 
  Trash2, 
  Eye, 
  Pin, 
  AlertCircle,
  Calendar,
  Users,
  BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { NoticeEditor } from "@/components/admin/NoticeEditor";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";

// Types
type Notice = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  publishDate: string;
  expiryDate?: string;
  isPublished: boolean;
  isPinned: boolean;
  targetType: "ALL" | "ROLE" | "DEPARTMENT" | "COURSE" | "SECTION" | "CUSTOM";
  targetCourseIds: string[];
  targetDepartments: string[];
  targetSectionIds: string[];
  targetUserRoles: string[];
  authorId: string;
  authorRole: string;
  authorName: string;
  attachmentUrls: string[];
  linkUrl?: string;
  viewCount?: number;
};

type Course = {
  id: string;
  code: string;
  name: string;
};

type Department = {
  id: string;
  name: string;
};

type Section = {
  id: string;
  name: string;
  courseId: string;
  courseName: string;
};

// Form validation schema
const noticeFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  content: z.string().min(10, "Content must be at least 10 characters"),
  targetType: z.enum(["ALL", "ROLE", "DEPARTMENT", "COURSE", "SECTION", "CUSTOM"]),
  targetCourseIds: z.array(z.string()).optional(),
  targetDepartments: z.array(z.string()).optional(),
  targetSectionIds: z.array(z.string()).optional(),
  targetUserRoles: z.array(z.string()).optional(),
  publishDate: z.date(),
  expiryDate: z.date().optional().nullable(),
  isPublished: z.boolean().default(true),
  isPinned: z.boolean().default(false),
  sendEmail: z.boolean().default(false),
  attachmentUrls: z.array(z.string()).optional(),
  linkUrl: z.string().url().optional().nullable(),
});

export default function NoticesManagementPage() {
  const { user } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [tabView, setTabView] = useState("all");

  // Form setup
  const form = useForm<z.infer<typeof noticeFormSchema>>({
    resolver: zodResolver(noticeFormSchema),
    defaultValues: {
      title: "",
      content: "",
      targetType: "ALL",
      targetCourseIds: [],
      targetDepartments: [],
      targetSectionIds: [],
      targetUserRoles: [],
      publishDate: new Date(),
      expiryDate: null,
      isPublished: true,
      isPinned: false,
      sendEmail: false,
      attachmentUrls: [],
      linkUrl: null,
    },
  });

  // Load notices and reference data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch notices
        const noticesRes = await fetch('/api/admin/notices');
        if (!noticesRes.ok) throw new Error('Failed to fetch notices');
        const noticesData = await noticesRes.json();
        setNotices(noticesData.notices);
        
        // Fetch courses
        const coursesRes = await fetch('/api/admin/courses');
        if (coursesRes.ok) {
          const coursesData = await coursesRes.json();
          setCourses(coursesData.courses);
        }
        
        // Fetch departments
        const deptsRes = await fetch('/api/admin/departments');
        if (deptsRes.ok) {
          const deptsData = await deptsRes.json();
          setDepartments(deptsData.departments);
        }
        
        // Fetch sections
        const sectionsRes = await fetch('/api/admin/sections');
        if (sectionsRes.ok) {
          const sectionsData = await sectionsRes.json();
          setSections(sectionsData.sections);
        }
      } catch (error) {
        console.error("Failed to load notices data:", error);
        toast({
          title: "Error",
          description: "Failed to load notices data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset form when opening create dialog
  const handleOpenCreateDialog = () => {
    form.reset({
      title: "",
      content: "",
      targetType: "ALL",
      targetCourseIds: [],
      targetDepartments: [],
      targetSectionIds: [],
      targetUserRoles: [],
      publishDate: new Date(),
      expiryDate: null,
      isPublished: true,
      isPinned: false,
      sendEmail: false,
      attachmentUrls: [],
      linkUrl: null,
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  // Load notice data for editing
  const handleEditNotice = (notice: Notice) => {
    setSelectedNotice(notice);
    const publishDate = new Date(notice.publishDate);
    const expiryDate = notice.expiryDate ? new Date(notice.expiryDate) : null;
    
    form.reset({
      title: notice.title,
      content: notice.content,
      targetType: notice.targetType,
      targetCourseIds: notice.targetCourseIds,
      targetDepartments: notice.targetDepartments,
      targetSectionIds: notice.targetSectionIds,
      targetUserRoles: notice.targetUserRoles,
      publishDate: publishDate,
      expiryDate: expiryDate,
      isPublished: notice.isPublished,
      isPinned: notice.isPinned,
      sendEmail: false,
      attachmentUrls: notice.attachmentUrls,
      linkUrl: notice.linkUrl || null,
    });
    
    setIsEditing(true);
    setIsCreating(true);
  };

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof noticeFormSchema>) => {
    try {
      const endpoint = isEditing && selectedNotice 
        ? `/api/admin/notices/${selectedNotice.id}` 
        : '/api/admin/notices';
      
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save notice');
      }

      const data = await response.json();
      
      if (isEditing) {
        setNotices(notices.map(n => n.id === selectedNotice?.id ? data.notice : n));
        toast({
          title: "Success",
          description: "Notice updated successfully",
        });
      } else {
        setNotices([data.notice, ...notices]);
        toast({
          title: "Success",
          description: "Notice created successfully",
        });
      }
      
      setIsCreating(false);
      setIsEditing(false);
      setSelectedNotice(null);
      
    } catch (error) {
      console.error("Failed to save notice:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save notice",
        variant: "destructive",
      });
    }
  };

  // Handle notice deletion
  const handleDeleteNotice = async (noticeId: string) => {
    try {
      const response = await fetch(`/api/admin/notices/${noticeId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notice');
      }

      setNotices(notices.filter(n => n.id !== noticeId));
      setConfirmDelete(null);
      
      toast({
        title: "Success",
        description: "Notice deleted successfully",
      });
    } catch (error) {
      console.error("Failed to delete notice:", error);
      toast({
        title: "Error",
        description: "Failed to delete notice",
        variant: "destructive",
      });
    }
  };

  // Filter notices based on tab view
  const filteredNotices = notices.filter(notice => {
    if (tabView === "all") return true;
    if (tabView === "published") return notice.isPublished;
    if (tabView === "pinned") return notice.isPinned;
    if (tabView === "upcoming") {
      const publishDate = new Date(notice.publishDate);
      return publishDate > new Date();
    }
    if (tabView === "expired") {
      if (!notice.expiryDate) return false;
      const expiryDate = new Date(notice.expiryDate);
      return expiryDate < new Date();
    }
    return true;
  });

  // Helper to format date
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Display target information
  const getTargetDisplay = (notice: Notice) => {
    switch (notice.targetType) {
      case "ALL":
        return "Everyone";
      case "ROLE":
        return `${notice.targetUserRoles.join(", ")}`;
      case "DEPARTMENT":
        return `${notice.targetDepartments.join(", ")}`;
      case "COURSE":
        return `${notice.targetCourseIds.length} Course(s)`;
      case "SECTION":
        return `${notice.targetSectionIds.length} Section(s)`;
      case "CUSTOM":
        return "Custom Selection";
      default:
        return "Unknown";
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner message="Loading notices..." />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Notice Management</h1>
          <Dialog open={isCreating} onOpenChange={setIsCreating}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenCreateDialog}>
                <Bell className="mr-2 h-4 w-4" />
                Create Notice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {isEditing ? "Edit Notice" : "Create Notice"}
                </DialogTitle>
                <DialogDescription>
                  {isEditing 
                    ? "Update this notice with new information." 
                    : "Create a new notice to announce information to users."}
                </DialogDescription>
              </DialogHeader>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                    {/* Title */}
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Notice title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Content - Rich Text Editor */}
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Content</FormLabel>
                          <FormControl>
                            <NoticeEditor
                              value={field.value}
                              onChange={field.onChange}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Type */}
                    <FormField
                      control={form.control}
                      name="targetType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target audience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ALL">Everyone</SelectItem>
                              <SelectItem value="ROLE">By Role</SelectItem>
                              <SelectItem value="DEPARTMENT">By Department</SelectItem>
                              <SelectItem value="COURSE">By Course</SelectItem>
                              <SelectItem value="SECTION">By Section</SelectItem>
                              <SelectItem value="CUSTOM">Custom Selection</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Roles - Show if targetType is ROLE or CUSTOM */}
                    {(form.watch("targetType") === "ROLE" || form.watch("targetType") === "CUSTOM") && (
                      <FormField
                        control={form.control}
                        name="targetUserRoles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Roles</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={[
                                  { value: "ADMIN", label: "Administrators" },
                                  { value: "FACULTY", label: "Faculty" },
                                  { value: "STUDENT", label: "Students" },
                                ]}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder="Select roles"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Target Departments - Show if targetType is DEPARTMENT or CUSTOM */}
                    {(form.watch("targetType") === "DEPARTMENT" || form.watch("targetType") === "CUSTOM") && (
                      <FormField
                        control={form.control}
                        name="targetDepartments"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Departments</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={departments.map(dept => ({
                                  value: dept.name,
                                  label: dept.name
                                }))}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder="Select departments"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Target Courses - Show if targetType is COURSE or CUSTOM */}
                    {(form.watch("targetType") === "COURSE" || form.watch("targetType") === "CUSTOM") && (
                      <FormField
                        control={form.control}
                        name="targetCourseIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Courses</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={courses.map(course => ({
                                  value: course.id,
                                  label: `${course.code} - ${course.name}`
                                }))}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder="Select courses"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Target Sections - Show if targetType is SECTION or CUSTOM */}
                    {(form.watch("targetType") === "SECTION" || form.watch("targetType") === "CUSTOM") && (
                      <FormField
                        control={form.control}
                        name="targetSectionIds"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Sections</FormLabel>
                            <FormControl>
                              <MultiSelect
                                options={sections.map(section => ({
                                  value: section.id,
                                  label: `${section.name} (${section.courseName})`
                                }))}
                                selected={field.value || []}
                                onChange={field.onChange}
                                placeholder="Select sections"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {/* Publish Date */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="publishDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Publish Date</FormLabel>
                            <DatePicker
                            // @ts-ignore
                              date={field.value || undefined}
                              onSelect={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Expiry Date (Optional) */}
                      <FormField
                        control={form.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Expiry Date (Optional)</FormLabel>
                            <DatePicker
                            // @ts-ignore
                              date={field.value || undefined}
                              onDateChange={field.onChange}
                            />
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* URL Link (Optional) */}
                    <FormField
                      control={form.control}
                      name="linkUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>External Link URL (Optional)</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/resource" 
                              {...field} 
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Published</FormLabel>
                              <FormDescription>
                                Make this notice visible to users
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isPinned"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Pin Notice</FormLabel>
                              <FormDescription>
                                Show at the top of notices
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="sendEmail"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                            <div className="space-y-0.5">
                              <FormLabel className="text-base">Send Email</FormLabel>
                              <FormDescription>
                                Send email notification
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancel
                      </Button>
                    </DialogClose>
                    <Button type="submit">
                      {isEditing ? "Update Notice" : "Create Notice"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs for filtering notices */}
        <Tabs defaultValue="all" value={tabView} onValueChange={setTabView}>
          <div className="border-b">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all" className="flex items-center">
                All Notices 
                <Badge variant="outline" className="ml-2">{notices.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="published" className="flex items-center">
                Published
                <Badge variant="outline" className="ml-2">
                  {notices.filter(n => n.isPublished).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pinned" className="flex items-center">
                Pinned
                <Badge variant="outline" className="ml-2">
                  {notices.filter(n => n.isPinned).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex items-center">
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="expired" className="flex items-center">
                Expired
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="pt-6">
            <NoticesList 
              notices={filteredNotices}
              onEdit={handleEditNotice}
              onDelete={(id) => setConfirmDelete(id)}
            />
          </TabsContent>
          
          <TabsContent value="published" className="pt-6">
            <NoticesList 
              notices={filteredNotices}
              onEdit={handleEditNotice}
              onDelete={(id) => setConfirmDelete(id)}
            />
          </TabsContent>
          
          <TabsContent value="pinned" className="pt-6">
            <NoticesList 
              notices={filteredNotices}
              onEdit={handleEditNotice}
              onDelete={(id) => setConfirmDelete(id)}
            />
          </TabsContent>
          
          <TabsContent value="upcoming" className="pt-6">
            <NoticesList 
              notices={filteredNotices}
              onEdit={handleEditNotice}
              onDelete={(id) => setConfirmDelete(id)}
            />
          </TabsContent>
          
          <TabsContent value="expired" className="pt-6">
            <NoticesList 
              notices={filteredNotices}
              onEdit={handleEditNotice}
              onDelete={(id) => setConfirmDelete(id)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this notice? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => confirmDelete && handleDeleteNotice(confirmDelete)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

// Helper component to display notices list
function NoticesList({ 
  notices, 
  onEdit, 
  onDelete 
}: { 
  notices: Notice[], 
  onEdit: (notice: Notice) => void, 
  onDelete: (id: string) => void 
}) {
  if (notices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">No notices found</h3>
        <p className="mt-1 text-sm text-gray-500">
          There are no notices matching your current filter.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {notices.map((notice) => (
        <Card key={notice.id} className={notice.isPinned ? "border-blue-400 shadow-md" : ""}>
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  {notice.isPinned && (
                    <Pin className="h-4 w-4 text-blue-500" />
                  )}
                  <CardTitle className="text-xl">{notice.title}</CardTitle>
                </div>
                <CardDescription className="mt-1 flex items-center space-x-4 text-sm">
                  <span>Published: {format(new Date(notice.publishDate), "MMM d, yyyy")}</span>
                  {notice.expiryDate && (
                    <span>Expires: {format(new Date(notice.expiryDate), "MMM d, yyyy")}</span>
                  )}
                  {!notice.isPublished && (
                    <Badge variant="outline">Draft</Badge>
                  )}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(notice)}
                >
                  <PenLine className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDelete(notice.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none">
              <div 
                className="line-clamp-3" 
                dangerouslySetInnerHTML={{ __html: notice.content.substring(0, 300) + (notice.content.length > 300 ? "..." : "") }} 
              />
            </div>
            <div className="mt-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  
                  {/* <span>For: {getTargetDisplay(notice)}</span> */}
                </div>
                {notice.linkUrl && (
                  <div className="text-sm text-blue-600 flex items-center space-x-1">
                    <BookOpen className="h-4 w-4" />
                    <a href={notice.linkUrl} target="_blank" rel="noopener noreferrer">
                      Resource Link
                    </a>
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-500">
                By {notice.authorName}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}