import { format, parseISO } from 'date-fns';

interface Assignment {
  id: string;
  title: string;
  courseCode: string;
  courseName: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
}

type UpcomingAssignmentsProps = {
  assignments: Assignment[];
};

export default function UpcomingAssignments({ assignments }: UpcomingAssignmentsProps) {
  if (assignments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No upcoming assignments.
      </div>
    );
  }

  // Format the date
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d, yyyy');
    } catch (error) {
      return dateStr;
    }
  };

  // Get status badge styles
  const getStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'pending':
        return "bg-yellow-100 text-yellow-800";
      case 'submitted':
        return "bg-blue-100 text-blue-800";
      case 'graded':
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <ul className="divide-y divide-gray-200">
      {assignments.map((assignment) => (
        <li key={assignment.id} className="py-4">
          <div className="flex items-start">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900">
                {assignment.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {assignment.courseCode}: {assignment.courseName}
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(assignment.status)}`}>
                {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
              </span>
            </div>
          </div>
          <div className="mt-2">
            <div className="flex items-center text-xs text-gray-500">
              <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Due: {formatDate(assignment.dueDate)}</span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}