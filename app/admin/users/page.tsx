"use client";

import { useState } from "react";
import AdminLayout from "@/components/layouts/AdminLayout";
import UserTable from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { PlusCircle, Filter, Download } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRouter } from "next/navigation";
import UserStatistics from "@/components/admin/UserStatistics";

export default function AdminUsersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("all");
  
  return (
    <AdminLayout>
      <div className="py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage all users in the system - students, faculty, and administrators
            </p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => router.push("/admin/users/export")}>
              <Download className="h-4 w-4 mr-2" />
              Export Users
            </Button>
           
          </div>
        </div>
        
        <UserStatistics />

        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Users</CardTitle>
                <CardDescription>
                  {activeTab === "all" 
                    ? "All system users" 
                    : activeTab === "students" 
                    ? "All registered students" 
                    : activeTab === "faculty" 
                    ? "All faculty members" 
                    : "System administrators"}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Users</TabsTrigger>
                <TabsTrigger value="students">Students</TabsTrigger>
                <TabsTrigger value="faculty">Faculty</TabsTrigger>
                <TabsTrigger value="admins">Admins</TabsTrigger>
                <TabsTrigger value="pending">Pending Approval</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all">
                <UserTable role="all" />
              </TabsContent>
              
              <TabsContent value="students">
                <UserTable role="STUDENT" />
              </TabsContent>
              
              <TabsContent value="faculty">
                <UserTable role="FACULTY" />
              </TabsContent>
              
              <TabsContent value="admins">
                <UserTable role="ADMIN" />
              </TabsContent>
              
              <TabsContent value="pending">
                <UserTable role="all" pendingOnly={true} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
