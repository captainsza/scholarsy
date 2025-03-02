import { useRouter } from "next/navigation";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";

// Define proper types for the props
interface Faculty {
  user: {
    profile: {
      firstName: string;
      lastName: string;
    }
  }
}

interface Subject {
  id: string;
  code: string;
  name: string;
  creditHours: number;
  faculty?: Faculty;
  _count?: {
    assessments: number;
  }
}

interface SubjectsListProps {
  subjects: Subject[];
  sectionId: string;
  courseId: string;
}

export default function SubjectsList({ subjects, sectionId, courseId }: SubjectsListProps) {
  const router = useRouter();
  
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button 
          onClick={() => router.push(`/admin/courses/${courseId}/sections/${sectionId}/subjects/create`)}
        >
          Add New Subject
        </Button>
      </div>
      
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Credit Hours</TableHead>
                <TableHead>Faculty</TableHead>
                <TableHead>Assessments</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No subjects added to this section yet
                  </TableCell>
                </TableRow>
              ) : (
                subjects.map((subject) => (
                  <TableRow key={subject.id}>
                    <TableCell className="font-medium">{subject.code}</TableCell>
                    <TableCell>{subject.name}</TableCell>
                    <TableCell>{subject.creditHours}</TableCell>
                    <TableCell>
                      {subject.faculty ? (
                        <div className="flex items-center space-x-1">
                          <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 text-xs font-medium">
                            {subject.faculty.user.profile.firstName[0]}
                            {subject.faculty.user.profile.lastName[0]}
                          </div>
                          <span className="text-sm">
                            {subject.faculty.user.profile.firstName} {subject.faculty.user.profile.lastName}
                          </span>
                        </div>
                      ) : (
                        <Badge variant="outline">Not Assigned</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={(subject._count?.assessments ?? 0) > 0 ? "default" : "outline"}>
                        {subject._count?.assessments || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => router.push(`/admin/subjects/${subject.id}`)}
                        >
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/admin/subjects/${subject.id}/edit`)}
                        >
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
