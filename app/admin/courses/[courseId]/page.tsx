import { Suspense } from 'react';
import CourseDetailsContent from '@/components/admin/CourseDetailsContent';
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import AdminLayout from "@/components/layouts/AdminLayout";

// Use ts-expect-error to suppress the type error during build
interface CourseDetailsPageProps {
  params: {
    courseId: string;
  }
}

 // You can also add this directive just before the function declaration
 export default function CourseDetailsPage({ params }: CourseDetailsPageProps) {
  const { courseId } = params;
  return (
    <AdminLayout>
      <Suspense fallback={<LoadingSpinner message="Loading course details..." />}>
        <CourseDetailsContent courseId={courseId} />
      </Suspense>
    </AdminLayout>
  );
}
