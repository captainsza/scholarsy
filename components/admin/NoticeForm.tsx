"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/toastall";
import { MultiSelect } from "@/components/ui/multi-select";
import { FileUploadField, FileItem } from "@/components/ui/FileUploadField";
import { format } from "date-fns";

import dynamic from "next/dynamic";
const Editor = dynamic(() => import("@tinymce/tinymce-react").then(mod => mod.Editor), { ssr: false });

interface NoticeFormProps {
  mode: "create" | "edit";
  initialData?: any;
}

export default function NoticeForm({ mode, initialData }: NoticeFormProps) {
  const router = useRouter();
  
  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [publishDate, setPublishDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [isPinned, setIsPinned] = useState(false);
  const [targetType, setTargetType] = useState("ALL");
  const [targetCourses, setTargetCourses] = useState<string[]>([]);
  const [targetDepartments, setTargetDepartments] = useState<string[]>([]);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState("");
  
  // Attachment handling
  const [attachments, setAttachments] = useState<FileItem[]>([]);
  const [existingAttachmentUrls, setExistingAttachmentUrls] = useState<string[]>([]);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [courses, setCourses] = useState<{label: string, value: string}[]>([]);
  const [departments, setDepartments] = useState<{label: string, value: string}[]>([]);
  
  // Initialize form with edit data if available
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTitle(initialData.title || "");
      setContent(initialData.content || "");
      
      if (initialData.publishDate) {
        setPublishDate(format(new Date(initialData.publishDate), "yyyy-MM-dd'T'HH:mm"));
      }
      
      if (initialData.expiryDate) {
        setExpiryDate(format(new Date(initialData.expiryDate), "yyyy-MM-dd'T'HH:mm"));
      }
      
      setIsPublished(initialData.isPublished ?? true);
      setIsPinned(initialData.isPinned ?? false);
      setTargetType(initialData.targetType || "ALL");
      setTargetCourses(initialData.targetCourseIds || []);
      setTargetDepartments(initialData.targetDepartments || []);
      setTargetRoles(initialData.targetUserRoles || []);
      setLinkUrl(initialData.linkUrl || "");
      
      // Setup existing attachments
      if (initialData.attachmentUrls && initialData.attachmentUrls.length > 0) {
        const parsedAttachments: FileItem[] = initialData.attachmentUrls
          .map((attachment: string) => {
            try {
              const parsed = JSON.parse(attachment);
              return {
                name: parsed.name || "Attachment",
                type: parsed.type || "application/octet-stream",
                size: 0, // Size not available for existing files
                url: parsed.url
              };
            } catch (e) {
              // Handle legacy format or parse errors
              return {
                name: "Attachment",
                type: "application/octet-stream",
                size: 0,
                url: attachment
              };
            }
          });
        
        setAttachments(parsedAttachments);
        setExistingAttachmentUrls(parsedAttachments.map(att => att.url!));
      }
    }
    
    // Fetch departments and courses
    fetchDepartmentsAndCourses();
  }, [mode, initialData]);
  
  const fetchDepartmentsAndCourses = async () => {
    try {
      // Fetch departments
      const deptResponse = await fetch("/api/admin/departments");
      if (deptResponse.ok) {
        const deptData = await deptResponse.json();
        setDepartments(deptData.departments.map((dept: string) => ({ 
          label: dept, 
          value: dept
        })));
      }
      
      // Fetch courses
      const coursesResponse = await fetch("/api/admin/courses");
      if (coursesResponse.ok) {
        const coursesData = await coursesResponse.json();
        setCourses(coursesData.courses.map((course: any) => ({ 
          label: `${course.branch}: ${course.name}`, 
          value: course.id 
        })));
      }
    } catch (error) {
      console.error("Error fetching form data:", error);
      toast({
        title: "Error",
        description: "Failed to load form data. Please refresh the page.",
        variant: "destructive",
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Prepare attachment data
      const newAttachments = attachments
        .filter(file => file.data) // Only include files with base64 data (new uploads)
        .map(file => ({
          data: file.data,
          type: file.type,
          name: file.name
        }));
      
      const keepAttachments = mode === "edit" ? 
        attachments.filter(file => file.url).map(file => file.url!) : 
        [];
      
      // Prepare request data
      const requestData = {
        title,
        content,
        publishDate,
        expiryDate: expiryDate || null,
        isPublished,
        isPinned,
        targetType,
        targetCourseIds: targetType === "COURSE" ? targetCourses : [],
        targetDepartments: targetType === "DEPARTMENT" ? targetDepartments : [],
        targetUserRoles: targetType === "ROLE" ? targetRoles : [],
        linkUrl: linkUrl || null,
        newAttachments, // For POST and PUT
        keepAttachments // Only for PUT
      };
      
      let response;
      
      if (mode === "create") {
        response = await fetch("/api/admin/notices", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
      } else {
        response = await fetch(`/api/admin/notices/${initialData.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestData),
        });
      }
      
      if (response.ok) {
        toast({
          title: `Notice ${mode === "create" ? "created" : "updated"} successfully`,
          variant: "default",
        });
        
        router.push("/admin/notices");
        router.refresh();
      } else {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${mode} notice`);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleFileChange = (files: FileItem[]) => {
    setAttachments(files);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Notice title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            
            <div className="grid w-full gap-1.5">
              <Label htmlFor="content">Content</Label>
              <Editor
                apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || "no-api-key"} 
                value={content}
                onEditorChange={(newContent) => setContent(newContent)}
                disabled={false} // Use disabled prop instead of readonly
                init={{
                  height: 300,
                  menubar: true,
                  plugins: [
                    'advlist', 'autolink', 'lists', 'link', 'image', 'charmap',
                    'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                    'insertdatetime', 'media', 'table', 'preview', 'help', 'wordcount'
                  ],
                  toolbar: 'undo redo | blocks | ' +
                    'bold italic forecolor | alignleft aligncenter ' +
                    'alignright alignjustify | bullist numlist outdent indent | ' +
                    'removeformat | link image | help',
                  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
                  branding: false,
                  promotion: false
                }}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="grid w-full gap-1.5">
                <Label htmlFor="publishDate">Publish Date</Label>
                <Input
                  id="publishDate"
                  type="datetime-local"
                  value={publishDate}
                  onChange={(e) => setPublishDate(e.target.value)}
                />
                <p className="text-sm text-gray-500">If not set, current time will be used</p>
              </div>
              
              <div className="grid w-full gap-1.5">
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="datetime-local"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                />
                <p className="text-sm text-gray-500">Optional. The notice will not be visible after this date</p>
              </div>
            </div>
            
            <div className="grid w-full gap-1.5">
              <Label htmlFor="linkUrl">External Link URL (Optional)</Label>
              <Input
                id="linkUrl"
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
              />
            </div>
            
            <div className="grid w-full gap-1.5">
              <Label>Attachments</Label>
              <FileUploadField
                onFileChange={handleFileChange}
                initialFiles={attachments}
                maxFiles={5}
                maxSizeInMB={10}
                label="Upload documents or images"
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-medium mb-4">Publishing Options</h3>
          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Switch
                id="isPublished"
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <Label htmlFor="isPublished">Publish immediately</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isPinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="isPinned">Pin this notice</Label>
            </div>
            
            <div className="space-y-3">
              <Label>Target Audience</Label>
              <RadioGroup 
                value={targetType} 
                onValueChange={setTargetType}
                className="space-y-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ALL" id="target-all" />
                  <Label htmlFor="target-all">All Users</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="ROLE" id="target-role" />
                  <Label htmlFor="target-role">Specific Roles</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="DEPARTMENT" id="target-department" />
                  <Label htmlFor="target-department">Specific Departments</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="COURSE" id="target-course" />
                  <Label htmlFor="target-course">Specific Courses</Label>
                </div>
              </RadioGroup>
            </div>
            
            {targetType === "ROLE" && (
              <div className="space-y-3">
                <Label>Select Roles</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="role-student"
                      checked={targetRoles.includes("STUDENT")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTargetRoles([...targetRoles, "STUDENT"]);
                        } else {
                          setTargetRoles(targetRoles.filter(role => role !== "STUDENT"));
                        }
                      }}
                    />
                    <label 
                      htmlFor="role-student"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Students
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="role-faculty"
                      checked={targetRoles.includes("FACULTY")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTargetRoles([...targetRoles, "FACULTY"]);
                        } else {
                          setTargetRoles(targetRoles.filter(role => role !== "FACULTY"));
                        }
                      }}
                    />
                    <label 
                      htmlFor="role-faculty"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Faculty
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="role-admin"
                      checked={targetRoles.includes("ADMIN")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setTargetRoles([...targetRoles, "ADMIN"]);
                        } else {
                          setTargetRoles(targetRoles.filter(role => role !== "ADMIN"));
                        }
                      }}
                    />
                    <label 
                      htmlFor="role-admin"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Administrators
                    </label>
                  </div>
                </div>
              </div>
            )}
            
            {targetType === "DEPARTMENT" && (
              <div className="space-y-3">
                <Label>Select Departments</Label>
                <MultiSelect
                  options={departments}
                  selected={targetDepartments}
                  onChange={setTargetDepartments}
                  placeholder="Select departments..."
                />
              </div>
            )}
            
            {targetType === "COURSE" && (
              <div className="space-y-3">
                <Label>Select Courses</Label>
                <MultiSelect
                  options={courses}
                  selected={targetCourses}
                  onChange={setTargetCourses}
                  placeholder="Select courses..."
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : mode === "create" ? "Create Notice" : "Update Notice"}
        </Button>
      </div>
    </form>
  );
}
