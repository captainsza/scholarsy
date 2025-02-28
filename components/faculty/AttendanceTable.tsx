"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";

type Student = {
  id: string;
  name: string;
  enrollmentId: string;
  attendanceStatus: "PRESENT" | "ABSENT" | "LATE" | null;
  attendanceId: string | null;
};

type AttendanceTableProps = {
  courseId: string;
  date: string;
};

export default function AttendanceTable({ courseId, date }: AttendanceTableProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAttendance = async () => {
      if (!courseId || !date) return;

      try {
        setLoading(true);
        setSuccess(false);
        setError("");
        
        const response = await fetch(`/api/faculty/attendance?courseId=${courseId}&date=${date}`);
        
        if (response.ok) {
          const data = await response.json();
          setStudents(data.students);
        } else {
          console.error("Failed to fetch attendance data");
          setError("Failed to load attendance data. Please try again.");
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
        setError("An error occurred while loading attendance data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAttendance();
  }, [courseId, date]);

  const handleAttendanceChange = (studentId: string, status: "PRESENT" | "ABSENT" | "LATE") => {
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === studentId
          ? { ...student, attendanceStatus: status }
          : student
      )
    );
  };

  const saveAttendance = async () => {
    try {
      setSaving(true);
      setSuccess(false);
      setError("");

      const attendanceData = students.map((student) => ({
        studentId: student.id,
        status: student.attendanceStatus || "ABSENT", // Default to absent if not marked
        attendanceId: student.attendanceId,
      }));

      const response = await fetch("/api/faculty/attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId,
          date,
          attendanceData,
        }),
      });

      if (response.ok) {
        const updatedData = await response.json();
        
        // Update the local state with the returned data
        setStudents(
          students.map((student) => {
            const updatedAttendance = updatedData.attendance.find(
              (a: any) => a.studentId === student.id
            );
            
            return {
              ...student,
              attendanceStatus: updatedAttendance?.status || student.attendanceStatus,
              attendanceId: updatedAttendance?.id || student.attendanceId,
            };
          })
        );
        
        setSuccess(true);
      } else {
        const errorData = await response.json();
        setError(errorData.message || "Failed to save attendance.");
      }
    } catch (error) {
      console.error("Error saving attendance:", error);
      setError("An error occurred while saving attendance data.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500 mb-2"></div>
        <p>Loading students...</p>
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="p-10 text-center text-gray-500">
        No students enrolled in this course.
      </div>
    );
  }

  return (
    <div className="p-6">
      {success && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">Attendance saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Enrollment ID
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student Name
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Attendance Status
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.enrollmentId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(student.id, "PRESENT")}
                      className={`px-3 py-1 text-sm rounded-full ${
                        student.attendanceStatus === "PRESENT"
                          ? "bg-green-100 text-green-800 border-2 border-green-600"
                          : "bg-gray-100 text-gray-800 hover:bg-green-50"
                      }`}
                    >
                      Present
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(student.id, "LATE")}
                      className={`px-3 py-1 text-sm rounded-full ${
                        student.attendanceStatus === "LATE"
                          ? "bg-yellow-100 text-yellow-800 border-2 border-yellow-600"
                          : "bg-gray-100 text-gray-800 hover:bg-yellow-50"
                      }`}
                    >
                      Late
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAttendanceChange(student.id, "ABSENT")}
                      className={`px-3 py-1 text-sm rounded-full ${
                        student.attendanceStatus === "ABSENT" || student.attendanceStatus === null
                          ? "bg-red-100 text-red-800 border-2 border-red-600"
                          : "bg-gray-100 text-gray-800 hover:bg-red-50"
                      }`}
                    >
                      Absent
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={saveAttendance}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          {saving ? "Saving..." : "Save Attendance"}
        </button>
      </div>
    </div>
  );
}
