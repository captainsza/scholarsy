"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/Badge";
import { Calendar, Clock, FileText, ArrowRight, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface AssignmentProps {
  id: string;
  title: string;
  type: string;
  dueDate: string | null;
  subjectName: string;
  subjectCode: string;
  isSubmitted?: boolean;
}

interface UpcomingAssignmentsProps {
  assignments: AssignmentProps[];
}

export default function UpcomingAssignments({ assignments }: UpcomingAssignmentsProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  
  const displayAssignments = expanded ? assignments : assignments.slice(0, 3);
  
  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium flex items-center">
            <FileText className="h-5 w-5 mr-2 text-blue-500" />
            Upcoming Assignments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="rounded-full bg-blue-50 p-3 mb-4">
              <Calendar className="h-6 w-6 text-blue-500" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">No upcoming assignments</h3>
            <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium flex items-center">
          <FileText className="h-5 w-5 mr-2 text-blue-500" />
          Upcoming Assignments
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {displayAssignments.map((assignment) => (
            <li key={assignment.id} className="bg-gray-50 rounded-md p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-medium text-gray-900 line-clamp-1">{assignment.title}</h3>
                  <p className="text-xs text-gray-500">{assignment.subjectCode}: {assignment.subjectName}</p>
                </div>
                <Badge 
                  variant={
                    assignment.isSubmitted ? 'success' :
                    assignment.type === 'ASSIGNMENT' || assignment.type === 'Assignment' ? 'success' :
                    assignment.type === 'QUIZ' || assignment.type === 'Quiz' ? 'info' :
                    assignment.type === 'PROJECT' || assignment.type === 'Project' ? 'outline' :
                    assignment.type === 'MIDTERM' || assignment.type === 'FINAL' ? 'warning' :
                    'outline'
                  }
                  className="text-xs whitespace-nowrap"
                >
                  {assignment.type ? 
                    (typeof assignment.type === 'string' ? 
                      assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1).toLowerCase() 
                      : 'Assignment') 
                    : 'Assignment'}
                </Badge>
              </div>
              
              {assignment.dueDate && (
                <div className="flex items-center text-xs text-amber-600">
                  <Clock className="h-3 w-3 mr-1" />
                  <span>Due {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}</span>
                </div>
              )}
              
              <div className="mt-2 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs py-1 h-auto text-blue-600"
                  onClick={() => router.push(`/student/assignments/${assignment.id}`)}
                >
                  View <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        
        {assignments.length > 3 && (
          <div className="mt-3 text-center">
            <Button 
              variant="link" 
              onClick={() => setExpanded(!expanded)}
              className="text-sm"
            >
              {expanded ? 'Show less' : `Show ${assignments.length - 3} more`}
            </Button>
          </div>
        )}
        
        <div className="mt-4 flex justify-center">
          <Button 
            variant="outline" 
            size="sm"
            className="w-full"
            onClick={() => router.push('/student/assignments')}
          >
            View All Assignments <ExternalLink className="ml-2 h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}