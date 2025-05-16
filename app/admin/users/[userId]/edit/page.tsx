"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Save, ArrowLeft, User, BookOpen, GraduationCap } from "lucide-react";

interface UserEditPageProps {
  params: {
    userId: string;
  };
}

// Define form schema based on user role
const commonUserSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  profile: z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    phone: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    country: z.string().optional(),
    pincode: z.string().optional(),
  }),
  isApproved: z.boolean(),
  emailVerified: z.boolean(),
});

const studentSchema = commonUserSchema.extend({
  student: z.object({
    enrollmentId: z.string().min(1, "Enrollment ID is required"),
    department: z.string().min(1, "Department is required"),
    currentSemester: z.string().optional(),
    bloodGroup: z.string().optional(),
    fatherName: z.string().optional(),
    motherName: z.string().optional(),
    dob: z.string().optional(),
    admissionSession: z.string().optional(),
    academicStatus: z.string().optional(),
    courseName: z.string().optional(),
    branchName: z.string().optional(),
  }),
});

const facultySchema = commonUserSchema.extend({
  faculty: z.object({
    department: z.string().min(1, "Department is required"),
  }),
});

const adminSchema = commonUserSchema;

export default function UserEditPage({ params }: UserEditPageProps) {
  const { userId } = params;
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Create form with placeholder schema - we'll update it once we know the user role
  const form = useForm<any>({
    resolver: zodResolver(commonUserSchema),
    defaultValues: {
      email: "",
      profile: {
        firstName: "",
        lastName: "",
        phone: "",
      },
      isApproved: false,
      emailVerified: false,
    }
  });

  // Fetch user details
  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }
        
        const data = await response.json();
        const user = data.user;
        
        // Set user role
        setUserRole(user.role);

        // Update form resolver based on user role
        if (user.role === "STUDENT") {
          form.reset(user);
          form.setValue("student", user.student || {});
        } else if (user.role === "FACULTY") {
          form.reset(user);
          form.setValue("faculty", user.faculty || {});
        } else {
          // ADMIN or other roles
          form.reset(user);
        }

      } catch (err) {
        console.error("Error fetching user details:", err);
        toast({
          title: "Error",
          description: "Failed to load user details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, form]);

  // Handle form submission
  const onSubmit = async (values: any) => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update user");
      }
      
      toast({
        title: "Success",
        description: "User information updated successfully",
      });
      
      // Navigate back to the user details page
      router.push(`/admin/users/${userId}`);
    } catch (error: any) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading user details..." />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/admin/users/${userId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Edit User</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/users/${userId}`)}
            >
              Cancel
            </Button>
            <Button
              onClick={form.handleSubmit(onSubmit)}
              disabled={saving}
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <Tabs defaultValue="basic" className="space-y-4">
              <TabsList>
                <TabsTrigger value="basic">
                  <User className="h-4 w-4 mr-2" />
                  Basic Information
                </TabsTrigger>
                {userRole === "STUDENT" && (
                  <TabsTrigger value="student">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Student Details
                  </TabsTrigger>
                )}
                {userRole === "FACULTY" && (
                  <TabsTrigger value="faculty">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Faculty Details
                  </TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="basic">
                <Card>
                  <CardHeader>
                    <CardTitle>Basic Information</CardTitle>
                    <CardDescription>
                      Edit the user's basic account information and contact details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Account Details */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Account Details</h3>
                      
                      {/* Email */}
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Account Status */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="isApproved"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Account Approved</FormLabel>
                                <FormDescription>
                                  Allow this user to access the system
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="emailVerified"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                              <FormControl>
                                <Checkbox 
                                  checked={field.value} 
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <div className="space-y-1">
                                <FormLabel>Email Verified</FormLabel>
                                <FormDescription>
                                  Mark the user's email as verified
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                    
                    {/* Personal Information */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-lg font-medium">Personal Information</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* First Name */}
                        <FormField
                          control={form.control}
                          name="profile.firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Last Name */}
                        <FormField
                          control={form.control}
                          name="profile.lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      {/* Phone */}
                      <FormField
                        control={form.control}
                        name="profile.phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      {/* Gender */}
                      <FormField
                        control={form.control}
                        name="profile.gender"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Gender</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value || ''}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Male">Male</SelectItem>
                                <SelectItem value="Female">Female</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                                <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Contact Information */}
                    <div className="space-y-4 pt-4 border-t">
                      <h3 className="text-lg font-medium">Contact Information</h3>
                      
                      {/* Address */}
                      <FormField
                        control={form.control}
                        name="profile.address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                value={field.value || ''}
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* City */}
                        <FormField
                          control={form.control}
                          name="profile.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* State */}
                        <FormField
                          control={form.control}
                          name="profile.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State/Province</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Country */}
                        <FormField
                          control={form.control}
                          name="profile.country"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Country</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        {/* Postal Code */}
                        <FormField
                          control={form.control}
                          name="profile.pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Postal/ZIP Code</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {userRole === "STUDENT" && (
                <TabsContent value="student">
                  <Card>
                    <CardHeader>
                      <CardTitle>Student Details</CardTitle>
                      <CardDescription>
                        Edit student-specific information and academic details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Academic Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Academic Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Enrollment ID */}
                          <FormField
                            control={form.control}
                            name="student.enrollmentId"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Enrollment ID</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Department */}
                          <FormField
                            control={form.control}
                            name="student.department"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Department</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Current Semester */}
                          <FormField
                            control={form.control}
                            name="student.currentSemester"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Current Semester</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Academic Status */}
                          <FormField
                            control={form.control}
                            name="student.academicStatus"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Academic Status</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value || ''}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select status" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="REGULAR">Regular</SelectItem>
                                    <SelectItem value="BACKLOG">Backlog</SelectItem>
                                    <SelectItem value="DETAINED">Detained</SelectItem>
                                    <SelectItem value="READMISSION">Readmission</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Course Information */}
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">Course Information</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Course Name */}
                          <FormField
                            control={form.control}
                            name="student.courseName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Course Name</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Branch Name */}
                          <FormField
                            control={form.control}
                            name="student.branchName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Branch/Specialization</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Admission Session */}
                          <FormField
                            control={form.control}
                            name="student.admissionSession"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Admission Session</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      
                      {/* Personal Details */}
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-medium">Personal Details</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Date of Birth */}
                          <FormField
                            control={form.control}
                            name="student.dob"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Date of Birth</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="date" 
                                    {...field} 
                                    value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Blood Group */}
                          <FormField
                            control={form.control}
                            name="student.bloodGroup"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Blood Group</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Father's Name */}
                          <FormField
                            control={form.control}
                            name="student.fatherName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Father's Name</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Mother's Name */}
                          <FormField
                            control={form.control}
                            name="student.motherName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Mother's Name</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}

              {userRole === "FACULTY" && (
                <TabsContent value="faculty">
                  <Card>
                    <CardHeader>
                      <CardTitle>Faculty Details</CardTitle>
                      <CardDescription>
                        Edit faculty-specific information and department details.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Faculty Information */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Faculty Information</h3>
                        
                        {/* Department */}
                        <FormField
                          control={form.control}
                          name="faculty.department"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Department</FormLabel>
                              <FormControl>
                                <Input {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/admin/users/${userId}`)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <>Saving...</>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </AdminLayout>
  );
}
