"use client";

import { Suspense } from "react";
import StudentLayout from "@/components/layouts/StudentLayout";
import ProfilePage from "@/components/profile/ProfilePage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function StudentProfilePage() {
  return (
    <StudentLayout>
      <Suspense fallback={<LoadingSpinner message="Loading profile..." />}>
        <ProfilePage />
      </Suspense>
    </StudentLayout>
  );
}
