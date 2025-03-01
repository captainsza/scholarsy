"use client";

import { Suspense } from "react";
import FacultyLayout from "@/components/layouts/FacultyLayout";
import ProfilePage from "@/components/profile/ProfilePage";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function FacultyProfilePage() {
  return (
    <FacultyLayout>
      <Suspense fallback={<LoadingSpinner message="Loading profile..." />}>
        <ProfilePage />
      </Suspense>
    </FacultyLayout>
  );
}
