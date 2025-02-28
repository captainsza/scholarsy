interface Grade {
  courseCode: string;
  courseName: string;
  sessionalMark: number;
  attendanceMark: number;
  totalMark: number;
  grade: string;
}

type GradeTableProps = {
  grades: Grade[];
};

export default function GradeTable({ grades }: GradeTableProps) {
  if (grades.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No grade information available.
      </div>
    );
  }

  // Helper function to get color class based on grade
  const getGradeColor = (grade: string) => {
    if (grade === 'A' || grade === 'A+') return 'text-green-600';
    if (grade === 'B' || grade === 'B+') return 'text-blue-600';
    if (grade === 'C' || grade === 'C+') return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Course Code
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Course Name
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Sessional
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Attendance
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Total
          </th>
          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Grade
          </th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {grades.map((grade) => (
          <tr key={grade.courseCode}>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {grade.courseCode}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {grade.courseName}
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {grade.sessionalMark}/70
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              {grade.attendanceMark}/30
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
              {grade.totalMark}/100
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
              <span className={`font-bold ${getGradeColor(grade.grade)}`}>
                {grade.grade}
              </span>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
