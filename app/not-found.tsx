"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

// Type definitions for animation variants
interface AnimationVariants {
  hidden: { opacity: number; y?: number; scale?: number };
  visible: { opacity: number; y?: number; scale?: number; transition?: any };
  exit?: { opacity: number; y?: number; scale?: number; transition?: any };
  [key: string]: any; // Add index signature to make it compatible with framer-motion Variants
}

export default function NotFound() {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Animation variants
  const containerVariants: AnimationVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.8 } },
  };

  const textVariants: AnimationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.6 } },
  };

  const buttonVariants: AnimationVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1, transition: { delay: 0.8, duration: 0.6 } },
  };

  if (!isClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-16 h-16 border-4 border-t-cyan-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cyan-50/50 to-blue-100/50 font-sans overflow-hidden flex items-center justify-center relative">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-200/20 rounded-full -translate-x-1/2 translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-200/20 rounded-full translate-x-1/2 -translate-y-1/2" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            ScholarSync
          </Link>
          <Link
            href="/"
            className="px-4 py-2 text-gray-600 hover:text-cyan-600 transition-colors flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Back Home
          </Link>
        </div>
      </motion.header>

      {/* Main Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-2xl mx-auto px-4 text-center py-20"
      >
        {/* Animated 404 Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.8, type: "spring" }}
          className="flex justify-center mb-8"
        >
          <AlertTriangle className="w-24 h-24 text-cyan-500" />
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={textVariants}
          className="text-6xl md:text-7xl font-extrabold text-gray-900 tracking-tight"
        >
          <span className="block">404</span>
          <span className="block bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
            Page Not Found
          </span>
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={textVariants}
          className="mt-6 text-xl text-gray-600/90 max-w-lg mx-auto"
        >
          Oops! It seems you've ventured into uncharted territory. Let's get you back on track.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          variants={buttonVariants}
          className="mt-10 flex justify-center gap-4"
        >
          <Link
            href="/"
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full hover:from-cyan-600 hover:to-blue-600 transition-all flex items-center gap-2"
          >
            <ArrowLeft size={20} />
            Return Home
          </Link>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 border border-cyan-500 text-cyan-600 rounded-full hover:bg-cyan-50 transition-colors"
          >
            Go Back
          </button>
        </motion.div>

        {/* Fun Easter Egg */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-8 text-sm text-gray-500"
        >
          Or explore the void... just kidding, there's nothing here! 😄
        </motion.p>
      </motion.div>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full bg-gray-900/80 backdrop-blur-md text-gray-300 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          © {new Date().getFullYear()} ScholarSync. All rights reserved.
        </div>
      </footer>
    </div>
  );
}