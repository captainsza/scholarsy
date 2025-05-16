"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminLayout from "@/components/layouts/AdminLayout";
import UserTable from "@/components/admin/UserTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Filter,
  Search,
  Plus,
  RefreshCw,
  UserPlus,
} from "lucide-react";
import { toast } from "@/components/ui/toastall";

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [approval, setApproval] = useState("all");
  const [verification, setVerification] = useState("verified"); // Default to showing only verified users
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");

  // Fetch users based on filters
  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Construct query parameters
      const params = new URLSearchParams();
      if (role !== "all") params.append("role", role);
      if (search) params.append("search", search);
      if (approval !== "all") params.append("approval", approval);
      params.append("emailVerified", verification);
      params.append("page", currentPage.toString());
      
      const response = await fetch(`/api/admin/users?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }
      
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to load users. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh users when filters change
  useEffect(() => {
    fetchUsers();
  }, [role, approval, verification, currentPage]);

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  // Update filters when switching tabs
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    
    if (value === "pending") {
      setApproval("pending");
    } else if (value === "approved") {
      setApproval("approved");
    } else {
      setApproval("all");
    }
    
    // Reset page when changing tab
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
  
        </div>
        
        <Tabs defaultValue="all" value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <TabsList>
              <TabsTrigger value="all">All Users</TabsTrigger>
              <TabsTrigger value="pending">Pending Approval</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
            </TabsList>
            
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={fetchUsers}
                  className="flex items-center gap-1"
                >
                  <RefreshCw size={14} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by role" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="ADMIN">Administrators</SelectItem>
                <SelectItem value="FACULTY">Faculty</SelectItem>
                <SelectItem value="STUDENT">Students</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={verification} onValueChange={setVerification}>
              <SelectTrigger>
                <div className="flex items-center">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Email Verification" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="verified">Email Verified</SelectItem>
                <SelectItem value="unverified">Email Not Verified</SelectItem>
                <SelectItem value="all">All Users</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <TabsContent value="all">
            <UserTable
              users={users}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onRefresh={fetchUsers}
            />
          </TabsContent>
          
          <TabsContent value="pending">
            <UserTable
              users={users}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onRefresh={fetchUsers}
            />
          </TabsContent>
          
          <TabsContent value="approved">
            <UserTable
              users={users}
              loading={loading}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
              onRefresh={fetchUsers}
            />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
