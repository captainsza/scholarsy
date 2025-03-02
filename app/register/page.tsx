"use client";

import { useState, useMemo, useCallback, useEffect, ChangeEvent, JSX, Suspense } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FormState, RegistrationData } from "@/types";
import { CLASSNAMES, IMAGE_UPLOAD } from "@/constants/reg_styles";
import Image from "next/image";

// Create a wrapper component to handle search params
import RegisterForm from "@/components/auth/RegisterForm";

// Main component that will be rendered in the /register route
export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}