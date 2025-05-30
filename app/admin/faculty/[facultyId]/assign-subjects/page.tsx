"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/Badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Subject {
  id: string;
  name: string;
  code: string;
  department: string;
  credits: number;
}

interface AssignedSubject extends Subject {
  isAssigned: boolean;
}

export default function AssignSubjectsPage() {
  const params = useParams();
  const router = useRouter();
  const facultyId = params.id as string;
  
  const [faculty, setFaculty] = useState<any>(null);
  const [subjects, setSubjects] = useState<AssignedSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  useEffect(() => {
    fetchFacultyAndSubjects();
  }, [facultyId]);

  const fetchFacultyAndSubjects = async () => {
    try {
      setLoading(true);
      
      // Fetch faculty details
      const facultyRes = await fetch(`/api/admin/faculty/${facultyId}`);
      if (facultyRes.ok) {
        const facultyData = await facultyRes.json();
        setFaculty(facultyData);
        
        // Set initially assigned subjects
        const assignedSubjectIds = facultyData.subjects?.map((s: any) => s.id) || [];
        setSelectedSubjects(assignedSubjectIds);
      }
      
      // Fetch all subjects
      const subjectsRes = await fetch('/api/admin/subjects');
      if (subjectsRes.ok) {
        const subjectsData = await subjectsRes.json();
        
        // Mark which subjects are currently assigned
        const subjectsWithAssignment = subjectsData.map((subject: Subject) => ({
          ...subject,
          isAssigned: faculty?.subjects?.some((s: any) => s.id === subject.id) || false
        }));
        
        setSubjects(subjectsWithAssignment);
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
        throw new Error('Failed to update assignments');
      }
    } catch (error) {
      console.error('Error saving assignments:', error);
      toast.error('Failed to update subject assignments');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
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

      {/* Faculty Info */}
      <Card>
        <CardHeader>
          <CardTitle>Faculty Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p>{faculty?.user?.profile?.firstName} {faculty?.user?.profile?.lastName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Department</p>
              <p>{faculty?.department}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subject Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Available Subjects</CardTitle>
          <p className="text-sm text-gray-500">
            Select subjects to assign to this faculty member
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                <Checkbox
                  checked={selectedSubjects.includes(subject.id)}
                  onCheckedChange={() => handleSubjectToggle(subject.id)}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{subject.name}</h4>
                    <Badge variant="outline">{subject.code}</Badge>
                  </div>
                  <p className="text-sm text-gray-500">
                    {subject.department} • {subject.credits} credits
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Assignments'}
        </Button>
      </div>
    </div>
  );
}
