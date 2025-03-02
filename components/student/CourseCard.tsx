import React from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/Badge';
import { BookOpen, Users, Clock, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CourseProps {
  course: {
    id: string;
    name: string;
    code: string;
    credits: number;
    section: {
      name: string;
      academicTerm: string;
    };
    faculty?: {
      name: string;
    };
    enrollment: {
      status: string;
    };
    progress?: number;
  };
}

export default function CourseCard({ course }: CourseProps) {
  const router = useRouter();
  
  // Determine the background color based on enrollment status
  const getStatusColor = () => {
    switch (course.enrollment.status) {
      case "ACTIVE":
        return "border-l-4 border-l-green-500";
      case "DROPPED":
        return "border-l-4 border-l-red-500 opacity-60";
      case "ON_HOLD":
        return "border-l-4 border-l-yellow-400";
      default:
        return "border-l-4 border-l-gray-300";
    }
  };

  return (
    <Card 
      className={`hover:shadow-md transition-shadow ${getStatusColor()}`}
      onClick={() => router.push(`/student/courses/${course.id}`)}
    >
      <CardContent className="p-6 cursor-pointer">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-medium text-lg text-gray-900">{course.name}</h3>
            <div className="flex items-center mt-1 text-sm text-gray-500">
              <span className="inline-block">{course.code}</span>
              <span className="mx-2">•</span>
              <span>{course.credits} Credits</span>
            </div>
          </div>
          <Badge 
            variant={course.enrollment.status === 'ACTIVE' ? 'success' : 
                    course.enrollment.status === 'DROPPED' ? 'destructive' : 'default'}
          >
            {course.enrollment.status}
          </Badge>
        </div>
        
        <div className="mt-4 space-y-2">
          <div className="flex items-center text-sm">
            <Calendar className="h-4 w-4 text-blue-500 mr-2" />
            <span>{course.section.academicTerm}</span>
          </div>
          <div className="flex items-center text-sm">
            <BookOpen className="h-4 w-4 text-blue-500 mr-2" />
            <span>Section {course.section.name}</span>
          </div>
          <div className="flex items-center text-sm">
            <Users className="h-4 w-4 text-blue-500 mr-2" />
            <span>{course.faculty?.name || 'Faculty not assigned'}</span>
          </div>
        </div>

        {course.progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="font-medium">Progress</span>
              <span>{course.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full" 
                style={{ width: `${course.progress}%` }}
              ></div>
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="bg-gray-50 px-6 py-3">
        <div className="w-full text-right text-sm text-blue-600">
          View Course Details →
        </div>
      </CardFooter>
    </Card>
  );
}
