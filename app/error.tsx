'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, RefreshCcw, ChevronLeft } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to an error reporting service
    console.error('Global application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100 p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-cyan-100 text-center">
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                className="bg-red-50 p-4 rounded-full"
              >
                <AlertCircle className="h-10 w-10 text-red-500" />
              </motion.div>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-gray-600 mb-6">
              We apologize for the inconvenience. The system has encountered an unexpected error.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-50 p-4 rounded-lg mb-6 overflow-auto max-h-40 text-left">
                <p className="text-sm text-gray-600 font-mono">{error.message}</p>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">Error ID: {error.digest}</p>
                )}
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={reset}
                className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white flex items-center gap-1"
              >
                <RefreshCcw className="h-4 w-4" />
                Try again
              </Button>
              
              <Link href="/" passHref>
                <Button 
                  variant="outline"
                  className="border-cyan-200 text-cyan-700 hover:bg-cyan-50 flex items-center gap-1"
                >
                  <Home className="h-4 w-4" />
                  Go to home
                </Button>
              </Link>
              
              <Button 
                variant="ghost"
                onClick={() => window.history.back()}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Go back
              </Button>
            </div>
          </div>
          
          <p className="text-center text-sm text-gray-500 mt-4">
            If this problem persists, please contact support.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
