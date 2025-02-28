"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function VerifyEmail() {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null);
  
  const handleResendVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Failed to resend verification email');
      }
      
      setIsSubmitted(true);
      setError('');
      
      // Show verification URL if provided (development mode)
      if (data.verificationUrl) {
        setVerificationUrl(data.verificationUrl);
      }
    } catch (error: any) {
      setError(error.message);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verify your email</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We've sent a verification link to your email. Please check your inbox and click the link to verify your account.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        {isSubmitted ? (
          <div className="space-y-4">
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">
                Verification email has been sent. Please check your inbox.
              </span>
            </div>
            
            {verificationUrl && (
              <div className="bg-blue-50 border border-blue-300 text-blue-800 px-4 py-3 rounded relative">
                <p className="font-bold mb-2">Development Mode: Use this link to verify</p>
                <div className="text-sm break-all">
                  <a 
                    href={verificationUrl} 
                    className="text-blue-600 hover:underline"
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {verificationUrl}
                  </a>
                </div>
              </div>
            )}
            
            <div className="text-center">
              <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Return to login
              </Link>
            </div>
          </div>
        ) : (
          <form className="mt-8 space-y-6" onSubmit={handleResendVerification}>
            <div className="rounded-md shadow-sm">
              <div>
                <label htmlFor="email" className="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none rounded relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Email address"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Resend verification email
              </button>
            </div>
          </form>
        )}
        
        <div className="text-center mt-4">
          <Link href="/login" className="font-medium text-blue-600 hover:text-blue-500">
            Return to login
          </Link>
        </div>
      </div>
    </div>
  );
}
