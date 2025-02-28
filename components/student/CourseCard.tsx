import Link from 'next/link';

interface Course {
  id: string;
  code: string;
  name: string;
  credits: number;
  faculty: {
    name: string;
  };
}

type CourseCardProps = {
  course: Course;
};

export default function CourseCard({ course }: CourseCardProps) {
  return (
    <Link href={`/student/courses/${course.id}`} className="block">
      <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow duration-300">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-2">
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold mr-2 px-2.5 py-0.5 rounded">
              {course.code}
            </span>
            <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-0.5 rounded">
              {course.credits} Credits
            </span>
          </div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-2">
            {course.name}
          </h3>
          <p className="text-sm text-gray-500">
            Faculty: {course.faculty.name}
          </p>
        </div>
        <div className="bg-gray-50 px-4 py-3 sm:px-6">
          <div className="text-sm">
            <span className="font-medium text-blue-600 hover:text-blue-500">
              View course details <span aria-hidden="true">&rarr;</span>
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
