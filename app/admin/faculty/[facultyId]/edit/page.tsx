"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/layouts/AdminLayout";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { toast } from "@/components/ui/toastall";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { Save, ArrowLeft, User, BookOpen, Calendar, Briefcase } from "lucide-react";

interface FacultyEditPageProps {
  params: {
    facultyId: string;
  };
}

// Define form schema for faculty details
const facultySchema = z.object({
  department: z.string().min(1, "Department is required"),
  specialization: z.string().optional(),
  qualification: z.string().optional(),
  experience: z.string().optional(),
  researchInterests: z.string().optional(),
  officeLocation: z.string().optional(),
  officeHours: z.string().optional(),
  user: z.object({
    email: z.string().email("Please enter a valid email address"),
    isApproved: z.boolean(),
    emailVerified: z.boolean(),
    profile: z.object({
      firstName: z.string().min(1, "First name is required"),
      lastName: z.string().min(1, "Last name is required"),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      state: z.string().optional(),
      country: z.string().optional(),
      pincode: z.string().optional(),
    }),
  }),
});

export default function AdminFacultyEditPage({ params }: FacultyEditPageProps) {
  const { facultyId } = params;
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facultyData, setFacultyData] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Create form with zod validation
  const form = useForm<z.infer<typeof facultySchema>>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      department: "",
      specialization: "",
      qualification: "",
      experience: "",
      researchInterests: "",
      officeLocation: "",
      officeHours: "",
      user: {
        email: "",
        isApproved: false,
        emailVerified: false,
        profile: {
          firstName: "",
          lastName: "",
          phone: "",
          address: "",
          city: "",
          state: "",
          country: "",
          pincode: "",
        },
      },
    }
  });

  useEffect(() => {
    // Check if user is admin
    if (user && user.role === "ADMIN") {
      setIsAdmin(true);
    }

    const fetchFacultyDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/faculty/${facultyId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch faculty details");
        }
        
        const data = await response.json();
        setFacultyData(data.faculty);
        
        // Populate form with existing data
        form.reset({
          department: data.faculty.department,
          specialization: data.faculty.specialization || "",
          qualification: data.faculty.qualification || "",
          experience: data.faculty.experience || "",
          researchInterests: data.faculty.researchInterests || "",
          officeLocation: data.faculty.officeLocation || "",
          officeHours: data.faculty.officeHours || "",
          user: {
            email: data.faculty.user?.email || "",
            isApproved: data.faculty.user?.isApproved || false,
            emailVerified: data.faculty.user?.emailVerified || false,
            profile: {
              firstName: data.faculty.user?.profile?.firstName || "",
              lastName: data.faculty.user?.profile?.lastName || "",
              phone: data.faculty.user?.profile?.phone || "",
              address: data.faculty.user?.profile?.address || "",
              city: data.faculty.user?.profile?.city || "",
              state: data.faculty.user?.profile?.state || "",
              country: data.faculty.user?.profile?.country || "",
              pincode: data.faculty.user?.profile?.pincode || "",
            }
          }
        });
      } catch (err) {
        console.error("Error fetching faculty details:", err);
        toast({
          title: "Error",
          description: "Failed to load faculty details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchFacultyDetails();
  }, [facultyId, form, user]);

  // Handle form submission
  const onSubmit = async (values: z.infer<typeof facultySchema>) => {
    try {
      setSaving(true);
      
      // Different endpoints for admin vs. faculty member
      const endpoint = isAdmin 
        ? `/api/admin/faculty/${facultyId}` 
        : `/api/faculty/${facultyId}/edit`;
      
      const response = await fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to update faculty information");
      }
      
      toast({
        title: "Success",
        description: "Faculty information updated successfully",
      });
      
      // Navigate back to the appropriate page
      if (isAdmin) {
        router.push(`/admin/faculty/${facultyId}`);
      } else {
        router.push(`/faculty/${facultyId}`);
      }
    } catch (error: any) {
      console.error("Error updating faculty:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update faculty information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Security check - only allow admin or the faculty member themselves to edit
  useEffect(() => {
    if (!loading && user && !isAdmin && user.id !== facultyData?.user?.id) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to edit this profile",
        variant: "destructive",
      });
      router.push(`/faculty/${facultyId}`);
    }
  }, [loading, user, isAdmin, facultyData, router, facultyId]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="h-screen flex items-center justify-center">
          <LoadingSpinner message="Loading faculty details..." />
        </div>
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
              onClick={() => router.push(`/admin/faculty/${facultyId}`)}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Faculty Profile</h1>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => router.push(`/admin/faculty/${facultyId}`)}
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
            <Tabs defaultValue="personal" className="space-y-4">
              <TabsList>
                <TabsTrigger value="personal">
                  <User className="h-4 w-4 mr-2" />
                  Personal Information
                </TabsTrigger>
                <TabsTrigger value="academic">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Academic Profile
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <Calendar className="h-4 w-4 mr-2" />
                  Contact Details
                </TabsTrigger>
                {isAdmin && (
                  <TabsTrigger value="account">
                    <Briefcase className="h-4 w-4 mr-2" />
                    Account Settings
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Personal Information */}
              <TabsContent value="personal">
                <Card>
                  <CardHeader>
                    <CardTitle>Personal Information</CardTitle>
                    <CardDescription>
                      Update your personal information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="user.profile.firstName"
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
                      
                      <FormField
                        control={form.control}
                        name="user.profile.lastName"
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
                  
                    <FormField
                      control={form.control}
                      name="user.profile.phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="user.email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input {...field} readOnly={!isAdmin} />
                          </FormControl>
                          {!isAdmin && (
                            <FormDescription>
                              Email address can only be changed by an administrator.
                            </FormDescription>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Academic Profile */}
              <TabsContent value="academic">
                <Card>
                  <CardHeader>
                    <CardTitle>Academic and Professional Information</CardTitle>
                    <CardDescription>
                      Update your academic qualifications and professional details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="specialization"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Specialization</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="qualification"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Highest Qualification</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Professional Experience</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="researchInterests"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Research Interests</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3}
                              placeholder="Describe your research areas and interests"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contact Details */}
              <TabsContent value="contact">
                <Card>
                  <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                    <CardDescription>
                      Update your address and contact details
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="officeLocation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Office Location</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="officeHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Office Hours</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="e.g., Mon-Wed 2-4PM" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="user.profile.address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="user.profile.city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="user.profile.state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State/Province</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="user.profile.country"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Country</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="user.profile.pincode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Postal/ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Admin-only Account Settings */}
              {isAdmin && (
                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle>Account Settings</CardTitle>
                      <CardDescription>
                        Manage account status and verification
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="user.isApproved"
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
                                  Allow this faculty member to access the system
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="user.emailVerified"
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
                                  Mark the email as verified
                                </FormDescription>
                              </div>
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
                onClick={() => router.push(`/admin/faculty/${facultyId}`)}
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
