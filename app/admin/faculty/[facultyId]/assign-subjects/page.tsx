"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Search, User, BookOpen, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  credits: number;
  courseName: string;
  currentFacultyId: string | null;
  currentFacultyName: string | null;
  isAssignedToCurrentFaculty: boolean;
}

interface Faculty {
  id: string;
  department: string;
  user: {
    profile: {
      firstName: string;
      lastName: string;
      profileImage?: string;
    };
  };
  subjects: any[];
}

export default function AssignSubjectsPage() {
  const params = useParams();
  const router = useRouter();
  const facultyId = params.facultyId as string;
  
  const [faculty, setFaculty] = useState<Faculty | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchFacultyAndSubjects();
  }, [facultyId]);

  useEffect(() => {
    // Filter subjects based on search query
    const filtered = subjects.filter(subject =>
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.courseName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredSubjects(filtered);
  }, [subjects, searchQuery]);

  const fetchFacultyAndSubjects = async () => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/admin/faculty/${facultyId}/assign-subjects`);
      if (response.ok) {
        const data = await response.json();
        setFaculty(data.faculty);
        setSubjects(data.subjects);
        
        // Set initially selected subjects
        const assignedSubjectIds = data.subjects
          .filter((s: Subject) => s.isAssignedToCurrentFaculty)
          .map((s: Subject) => s.id);
        setSelectedSubjects(assignedSubjectIds);
      } else {
        throw new Error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects(prev => 
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const response = await fetch(`/api/admin/faculty/${facultyId}/assign-subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subjectIds: selectedSubjects }),
      });

      if (response.ok) {
        toast.success('Subject assignments updated successfully');
        router.back();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update assignments');
      }
    } catch (error: any) {
      console.error('Error saving assignments:', error);
      toast.error(error.message || 'Failed to update subject assignments');
    } finally {
      setSaving(false);
    }
  };

  const getSubjectStats = () => {
    const total = subjects.length;
    const assigned = selectedSubjects.length;
    const available = total - subjects.filter(s => s.currentFacultyId && !s.isAssignedToCurrentFaculty).length;
    
    return { total, assigned, available };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stats = getSubjectStats();

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Assign Subjects</h1>
            <p className="text-gray-500">
              Manage subject assignments for {faculty?.user?.profile?.firstName} {faculty?.user?.profile?.lastName}
            </p>
          </div>
        </div>

        {/* Faculty Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Faculty Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={faculty?.user?.profile?.profileImage} />
                <AvatarFallback className="bg-cyan-100 text-cyan-600 text-lg">
                  {faculty?.user?.profile?.firstName?.[0]}
                  {faculty?.user?.profile?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-lg font-semibold">
                      {faculty?.user?.profile?.firstName} {faculty?.user?.profile?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Department</p>
                    <p className="text-lg">{faculty?.department}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Subjects</p>
                    <p className="text-lg font-semibold text-cyan-600">{stats.assigned}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Subjects</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-green-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Assigned</p>
                  <p className="text-2xl font-bold text-green-600">{stats.assigned}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-cyan-100 rounded-full flex items-center justify-center">
                  <div className="h-4 w-4 bg-cyan-600 rounded-full"></div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Available</p>
                  <p className="text-2xl font-bold text-cyan-600">{stats.available}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subject Assignment */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Available Subjects</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search subjects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-500">
              Select subjects to assign to this faculty member
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {filteredSubjects.map((subject) => (
                <div 
                  key={subject.id} 
                  className={`flex items-center space-x-3 p-4 border rounded-lg transition-colors ${
                    selectedSubjects.includes(subject.id) 
                      ? 'border-cyan-200 bg-cyan-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Checkbox
                    checked={selectedSubjects.includes(subject.id)}
                    onCheckedChange={() => handleSubjectToggle(subject.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{subject.name}</h4>
                      <Badge variant="outline">{subject.code}</Badge>
                      <Badge variant="default">{subject.credits} Credits</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {subject.department}
                      </span>
                      <span>Course: {subject.courseName}</span>
                      {subject.currentFacultyName && !subject.isAssignedToCurrentFaculty && (
                        <Badge variant="destructive" className="text-xs">
                          Assigned to {subject.currentFacultyName}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredSubjects.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery ? 'No subjects found matching your search.' : 'No subjects available.'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}
