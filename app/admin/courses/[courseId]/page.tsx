import { Suspense } from 'react';
import CourseDetailsContent from '@/components/admin/CourseDetailsContent';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminLayout from "@/components/layouts/AdminLayout";

interface CourseDetailsPageProps {
  params: {
    courseId: string;
  }
}

export default function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  return (
    <AdminLayout>
      <Suspense fallback={<LoadingSpinner message="Loading course details..." />}>
        <CourseDetailsContent courseId={params.courseId} />
      </Suspense>
    </AdminLayout>
  );
}
