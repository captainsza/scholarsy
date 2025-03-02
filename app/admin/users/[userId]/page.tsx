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
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Edit,
  UserCog,
  UserPlus,
  UserMinus,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  Users,
  Book,
} from "lucide-react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import UserRoleChangeModal from "@/components/admin/UserRoleChangeModal";
import UserApprovalModal from "@/components/admin/UserApprovalModal";
import { useToast } from "@/components/ui/Toast";

interface UserDetailPageProps {
  params: {
    userId: string;
  };
}

export default function UserDetailPage({ params }: UserDetailPageProps) {
  const { userId } = params;
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [user, setUser] = useState<any>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/users/${userId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch user details");
        }
        
        const data = await response.json();
        setUser(data.user);
      } catch (err) {
        console.error("Error fetching user details:", err);
        toast({
          title: "Error",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId, toast]);

  const handleApprovalToggle = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isApproved: !user.isApproved }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update approval status");
      }
      
      const data = await response.json();
      setUser({ ...user, isApproved: !user.isApproved });
      
      toast({
        title: `User ${user.isApproved ? "disapproved" : "approved"}`,
        
      });
    } catch (err) {
      console.error("Error updating user approval:", err);
      toast({
        title: "Error",
        variant: "destructive",
      });
    }
  };

  const handleRoleChange = async (newRole: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/role`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update user role");
      }
      
      const data = await response.json();
      setUser({ ...user, role: newRole });
      
      toast({
        title: "Role Updated",
      });
    } catch (err) {
      console.error("Error updating user role:", err);
      toast({
        title: "Error",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <LoadingSpinner message="Loading user details..." />
      </AdminLayout>
    );
  }

  if (!user) {
    return (
      <AdminLayout>
        <div className="py-6 px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-red-700">User not found</p>
            <Button 
              onClick={() => router.push("/admin/users")}
              className="mt-4"
              variant="outline"
            >
              Back to Users
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Go back"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <h1 className="text-2xl font-bold text-gray-900">User Details</h1>
            <Badge 
             
              className="ml-2"
            >
              {user.role}
            </Badge>
            {!user.isApproved && <Badge variant="destructive">Pending Approval</Badge>}
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => setIsRoleModalOpen(true)}
            >
              <UserCog className="mr-2 h-4 w-4" />
              Change Role
            </Button>
            <Button
              variant={user.isApproved ? "destructive" : "default"}
              onClick={() => setIsApprovalModalOpen(true)}
            >
              {user.isApproved ? (
                <>
                  <UserMinus className="mr-2 h-4 w-4" />
                  Disapprove
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Approve
                </>
              )}
            </Button>
            <Button
              onClick={() => router.push(`/admin/users/${userId}/edit`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </div>
        </div>

        {/* User Details with tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {user.role === "STUDENT" && <TabsTrigger value="academic">Academic</TabsTrigger>}
            {user.role === "FACULTY" && <TabsTrigger value="courses">Courses</TabsTrigger>}
            <TabsTrigger value="activity">Activity Log</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Basic Profile Info */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-6">
                    <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl font-medium">
                      {user.profile?.firstName?.[0] || ''}{user.profile?.lastName?.[0] || ''}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold">
                        {user.profile?.firstName} {user.profile?.lastName}
                      </h3>
                      <div className="flex items-center mt-1 text-gray-500">
                        <Mail className="h-4 w-4 mr-1" />
                        {user.email}
                      </div>
                      {user.profile?.phone && (
                        <div className="flex items-center mt-1 text-gray-500">
                          <Phone className="h-4 w-4 mr-1" />
                          {user.profile.phone}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Account Information</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="text-xs text-gray-500">User ID</div>
                          <div className="font-mono text-sm">{user.id}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Created At</div>
                          <div className="text-sm">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Email Verified</div>
                          <div>
                            <Badge variant={user.emailVerified ? "success" : "destructive"}>
                              {user.emailVerified ? "Verified" : "Not Verified"}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Account Status</div>
                          <div>
                            <Badge variant={user.isApproved ? "success" : "destructive"}>
                              {user.isApproved ? "Approved" : "Pending Approval"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Role-specific Information</h4>
                      <div className="space-y-3">
                        {user.role === "STUDENT" && (
                          <>
                            <div>
                              <div className="text-xs text-gray-500">Enrollment ID</div>
                              <div className="text-sm font-semibold">{user.student?.enrollmentId}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Department</div>
                              <div className="text-sm">{user.student?.department}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Current Semester</div>
                              <div className="text-sm">{user.student?.currentSemester || "-"}</div>
                            </div>
                          </>
                        )}
                        
                        {user.role === "FACULTY" && (
                          <>
                            <div>
                              <div className="text-xs text-gray-500">Faculty ID</div>
                              <div className="text-sm font-semibold">{user.faculty?.id}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Department</div>
                              <div className="text-sm">{user.faculty?.department}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Courses</div>
                              <div className="text-sm">
                                {user.faculty?.subjects?.length || 0} assigned subjects
                              </div>
                            </div>
                          </>
                        )}
                        
                        {user.role === "ADMIN" && (
                          <>
                            <div>
                              <div className="text-xs text-gray-500">Admin ID</div>
                              <div className="text-sm font-semibold">{user.admin?.id}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Approvals Managed</div>
                              <div className="text-sm">{user.admin?.approvals?.length || 0}</div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {user.role === "STUDENT" && user.student && (
                      <>
                        <div>
                          <div className="text-xs text-gray-500 mb-1">Address</div>
                          <div className="flex items-start">
                            <MapPin className="h-4 w-4 mr-1 mt-0.5 text-gray-400" />
                            <div>
                              {user.student.address || "-"}<br />
                              {user.student.city}{user.student.city && user.student.state ? ', ' : ''}{user.student.state}<br />
                              {user.student.country} {user.student.pincode}
                            </div>
                          </div>
                        </div>
                        
                        <div className="pt-4 border-t">
                          <div className="text-xs text-gray-500 mb-1">Family Information</div>
                          <div className="space-y-2">
                            <div>
                              <div className="text-xs text-gray-500">Father's Name</div>
                              <div className="text-sm">{user.student.fatherName || "-"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Mother's Name</div>
                              <div className="text-sm">{user.student.motherName || "-"}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {/* Personal details */}
                    <div className={user.role === "STUDENT" ? "pt-4 border-t" : ""}>
                      <div className="text-xs text-gray-500 mb-1">Personal Details</div>
                      <div className="space-y-2">
                        {user.role === "STUDENT" && user.student && (
                          <>
                            <div>
                              <div className="text-xs text-gray-500">Date of Birth</div>
                              <div className="text-sm">
                                {user.student.dob 
                                  ? new Date(user.student.dob).toLocaleDateString() 
                                  : "-"}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Gender</div>
                              <div className="text-sm">{user.student.gender || "-"}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Blood Group</div>
                              <div className="text-sm">{user.student.bloodGroup || "-"}</div>
                            </div>
                          </>
                        )}
                        <div>
                          <div className="text-xs text-gray-500">Email</div>
                          <div className="text-sm">{user.email}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Phone</div>
                          <div className="text-sm">{user.profile?.phone || "-"}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {user.role === "STUDENT" && (
            <TabsContent value="academic">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Academic Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Academic Details</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-500">Admission Session</div>
                            <div className="text-sm">{user.student?.admissionSession || "-"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Admission Semester</div>
                            <div className="text-sm">{user.student?.admissionSemester || "-"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Current Semester</div>
                            <div className="text-sm">{user.student?.currentSemester || "-"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Academic Status</div>
                            <div className="text-sm">
                              <Badge variant={
                                user.student?.academicStatus === "REGULAR" ? "success" :
                                user.student?.academicStatus === "DETAINED" ? "destructive" : 
                                "warning"
                              }>
                                {user.student?.academicStatus || "REGULAR"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Institution Details</h4>
                        <div className="space-y-3">
                          <div>
                            <div className="text-xs text-gray-500">Institute Name</div>
                            <div className="text-sm">{user.student?.instituteName || "-"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Institute Code</div>
                            <div className="text-sm">{user.student?.instituteCode || "-"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Course Name</div>
                            <div className="text-sm">{user.student?.courseName || "-"}</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Branch Name</div>
                            <div className="text-sm">{user.student?.branchName || "-"}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Enrollment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Current Enrollments</div>
                        <div className="text-lg font-bold">
                          {user.student?.sectionEnrollments?.length || 0}
                        </div>
                        <div className="text-sm text-gray-500">active course sections</div>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => router.push(`/admin/students/${user.student?.id}/enrollments`)}
                      >
                        <Users className="mr-2 h-4 w-4" />
                        View Enrollments
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          )}
          
          {user.role === "FACULTY" && (
            <TabsContent value="courses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Assigned Courses</CardTitle>
                    <CardDescription>Courses and sections assigned to this faculty member</CardDescription>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => router.push(`/admin/faculty/${user.faculty?.id}/courses`)}
                  >
                    <Book className="mr-2 h-4 w-4" />
                    Manage Courses
                  </Button>
                </CardHeader>
                <CardContent>
                  {user.faculty?.subjects && user.faculty.subjects.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Subject Code
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Name
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Section
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Credit Hours
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Students
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {user.faculty.subjects.map((subject: any) => (
                            <tr key={subject.id}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                {subject.code}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {subject.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {subject.section?.name || "-"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {subject.creditHours}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {subject.section?._count?.enrollments || 0}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      No courses currently assigned to this faculty member.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          )}
          
          <TabsContent value="activity">
            <Card>
              <CardHeader>
                <CardTitle>User Activity Log</CardTitle>
                <CardDescription>Recent activity and system interactions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-16 text-gray-500">
                  User activity logging coming soon
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Role Change Modal */}
      <UserRoleChangeModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
        currentRole={user.role}
        onConfirm={handleRoleChange}
        userName={user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email}
      />
      
      {/* Approval Modal */}
      <UserApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        isApproved={user.isApproved}
        onConfirm={handleApprovalToggle}
        userName={user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email}
      />
    </AdminLayout>
  );
}
