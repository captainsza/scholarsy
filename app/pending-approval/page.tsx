import Link from 'next/link';

export default function PendingApproval() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Account Pending Approval</h2>
          <div className="mt-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded relative">
            <p className="text-center">
              Your account is awaiting administrator approval.
            </p>
          </div>
          <p className="mt-4 text-gray-600">
            Once your account is approved, you will receive an email notification and can log in to access all features.
          </p>
          <p className="mt-2 text-gray-600">
            If you have any questions, please contact the system administrator.
          </p>
          <div className="mt-8">
            <Link href="/login" className="font-medium text-lg text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-md">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
