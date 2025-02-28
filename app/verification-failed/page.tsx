import Link from 'next/link';

export default function VerificationFailed() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Verification Failed</h2>
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <p className="text-center">
              The verification link is invalid or has expired.
            </p>
          </div>
          <p className="mt-4 text-gray-600">
            Please request a new verification link by clicking the button below.
          </p>
          <div className="mt-8">
            <Link href="/verify-email" className="font-medium text-lg text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">
              Request New Verification Link
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
