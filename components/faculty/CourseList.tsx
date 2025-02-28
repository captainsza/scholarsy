"use client";

import Link from 'next/link';

type Course = {
  id: string;
  code: string;
  name: string;
  studentsCount: number;
};

type CourseListProps = {
  courses: Course[];
};

export default function CourseList({ courses }: CourseListProps) {
  if (courses.length === 0) {
    return (
      <div className="py-8 text-center text-gray-500">
        No courses assigned for this semester.
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {courses.map((course) => (
          <li key={course.id} className="px-6 py-4 hover:bg-gray-50">
            <Link href={`/faculty/courses/${course.id}`} className="block">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-purple-600 truncate">{course.code}</p>
                  <p className="text-base font-semibold text-gray-900 truncate">{course.name}</p>
                </div>
                <div className="flex items-center">
                  <div className="ml-2 flex items-center text-sm text-gray-500">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                    <span>{course.studentsCount} students</span>
                  </div>
                  <div className="ml-4">
                    <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
