import { Suspense } from 'react';
import CourseDetailsContent from '@/components/admin/CourseDetailsContent';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminLayout from "@/components/layouts/AdminLayout";

interface CourseDetailsPageProps {
  params: {
    courseId: string;
  }
}

export default async function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { courseId } = params;
  return (
    <AdminLayout>
      <Suspense fallback={<LoadingSpinner message="Loading course details..." />}>
        <CourseDetailsContent courseId={courseId} />
      </Suspense>
    </AdminLayout>
  );
}
