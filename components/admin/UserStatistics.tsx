"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, UserCog, UserX, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UserStatistics() {
  const [stats, setStats] = useState({
    total: 0,
    students: 0,
    faculty: 0,
    admins: 0,
    pending: 0,
    recentRegistrations: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      
      const response = await fetch("/api/admin/users/statistics");
      
      if (!response.ok) {
        throw new Error("Failed to fetch user statistics");
      }
      
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching statistics:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatistics();
  };

  return (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium text-gray-900">User Statistics</h2>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-blue-600" />
              <p className="text-sm font-medium">Total Users</p>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold">{stats.total}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5 text-green-600" />
              <p className="text-sm font-medium">Students</p>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold">{stats.students}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserCog className="h-5 w-5 text-purple-600" />
              <p className="text-sm font-medium">Faculty</p>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold">{stats.faculty}</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium">Pending Approval</p>
            </div>
            <div className="mt-4">
              {loading ? (
                <div className="h-7 w-16 bg-gray-200 animate-pulse rounded"></div>
              ) : (
                <p className="text-2xl font-bold">{stats.pending}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
