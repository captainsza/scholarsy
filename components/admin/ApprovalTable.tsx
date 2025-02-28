"use client";

import { useState, useEffect } from "react";
import { formatDistance } from "date-fns";

type Approval = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  role: string;
  department: string;
  enrollmentId?: string;
  createdAt: string;
};

export default function ApprovalTable() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [processing, setProcessing] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/admin/approvals${selectedRole ? `?role=${selectedRole}` : ''}`);
        if (response.ok) {
          const data = await response.json();
          setApprovals(data.approvals);
        } else {
          console.error("Failed to fetch approvals");
        }
      } catch (error) {
        console.error("Error fetching approvals:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchApprovals();
  }, [selectedRole]);

  const handleApprove = async (userId: string) => {
    await handleApprovalAction(userId, 'approve');
  };

  const handleReject = async (userId: string) => {
    await handleApprovalAction(userId, 'reject');
  };

  const handleApprovalAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      setProcessing(prev => ({ ...prev, [userId]: true }));
      
      const response = await fetch('/api/admin/approvals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, action }),
      });
      
      if (response.ok) {
        // Remove the processed user from the list
        setApprovals(approvals.filter(approval => approval.userId !== userId));
      } else {
        console.error(`Failed to ${action} user`);
      }
    } catch (error) {
      console.error(`Error during ${action} action:`, error);
    } finally {
      setProcessing(prev => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="px-6 pb-6">
      {/* Filter controls */}
      <div className="mb-4 flex items-center mt-4">
        <span className="text-sm font-medium text-gray-700 mr-3">Filter by role:</span>
        <div className="flex space-x-2">
          <button
            onClick={() => setSelectedRole(null)}
            className={`px-3 py-1 text-sm rounded-full ${
              selectedRole === null
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedRole("FACULTY")}
            className={`px-3 py-1 text-sm rounded-full ${
              selectedRole === "FACULTY"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Faculty
          </button>
          <button
            onClick={() => setSelectedRole("STUDENT")}
            className={`px-3 py-1 text-sm rounded-full ${
              selectedRole === "STUDENT"
                ? "bg-blue-100 text-blue-800"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            Students
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Requested
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                  </div>
                  <p className="mt-2">Loading approval requests...</p>
                </td>
              </tr>
            ) : approvals.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                  No pending approvals found
                </td>
              </tr>
            ) : (
              approvals.map((approval) => (
                <tr key={approval.userId}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-medium">
                          {approval.userName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {approval.userName}
                        </div>
                        <div className="text-sm text-gray-500">{approval.userEmail}</div>
                        {approval.enrollmentId && (
                          <div className="text-xs text-gray-500">
                            ID: {approval.enrollmentId}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${approval.role === "FACULTY" 
                        ? "bg-purple-100 text-purple-800" 
                        : "bg-green-100 text-green-800"}`
                    }>
                      {approval.role === "FACULTY" ? "Faculty" : "Student"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {approval.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDistance(new Date(approval.createdAt), new Date(), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleApprove(approval.userId)}
                      disabled={processing[approval.userId]}
                      className="text-green-600 hover:text-green-900 mr-4 disabled:opacity-50"
                    >
                      {processing[approval.userId] ? "Processing..." : "Approve"}
                    </button>
                    <button
                      onClick={() => handleReject(approval.userId)}
                      disabled={processing[approval.userId]}
                      className="text-red-600 hover:text-red-900 disabled:opacity-50"
                    >
                      {processing[approval.userId] ? "Processing..." : "Reject"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
