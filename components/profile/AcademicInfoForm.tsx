import { useState } from "react";
import { AuthUser } from "@/types";
import { Role } from "@prisma/client";

interface AcademicInfoFormProps {
  data: Partial<AuthUser>;
  onSubmit: (data: any) => Promise<void>;
  loading: boolean;
  userRole: Role;
}

export default function AcademicInfoForm({ data, onSubmit, loading, userRole }: AcademicInfoFormProps) {
  const [formData, setFormData] = useState({
    // Faculty fields
    department: data.faculty?.department || data.student?.department || "",
    
    // Student fields
    enrollmentId: data.student?.enrollmentId || "",
    admissionSession: data.student?.admissionSession || "",
    admissionSemester: data.student?.admissionSemester || "",
    academicStatus: data.student?.academicStatus || "REGULAR",
    instituteCode: data.student?.instituteCode || "",
    instituteName: data.student?.instituteName || "",
    courseName: data.student?.courseName || "",
    branchName: data.student?.branchName || "",
    currentSemester: data.student?.currentSemester || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedData: any = {};

    if (userRole === "FACULTY") {
      updatedData.faculty = {
        department: formData.department,
      };
    } else if (userRole === "STUDENT") {
      updatedData.student = {
        department: formData.department,
        admissionSession: formData.admissionSession,
        admissionSemester: formData.admissionSemester,
        academicStatus: formData.academicStatus,
        instituteCode: formData.instituteCode,
        instituteName: formData.instituteName,
        courseName: formData.courseName,
        branchName: formData.branchName,
        currentSemester: formData.currentSemester,
      };
    }

    onSubmit(updatedData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="department" className="block text-sm font-medium text-gray-700">
            Department
          </label>
          <input
            type="text"
            name="department"
            id="department"
            value={formData.department}
            onChange={handleChange}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {userRole === "STUDENT" && (
          <>
            <div>
              <label htmlFor="enrollmentId" className="block text-sm font-medium text-gray-700">
                Enrollment ID
              </label>
              <input
                type="text"
                name="enrollmentId"
                id="enrollmentId"
                value={formData.enrollmentId}
                onChange={handleChange}
                disabled // Enrollment ID should not be changeable
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="currentSemester" className="block text-sm font-medium text-gray-700">
                Current Semester
              </label>
              <input
                type="text"
                name="currentSemester"
                id="currentSemester"
                value={formData.currentSemester}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="admissionSession" className="block text-sm font-medium text-gray-700">
                Admission Session
              </label>
              <input
                type="text"
                name="admissionSession"
                id="admissionSession"
                value={formData.admissionSession}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="admissionSemester" className="block text-sm font-medium text-gray-700">
                Admission Semester
              </label>
              <input
                type="text"
                name="admissionSemester"
                id="admissionSemester"
                value={formData.admissionSemester}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="academicStatus" className="block text-sm font-medium text-gray-700">
                Academic Status
              </label>
              <select
                id="academicStatus"
                name="academicStatus"
                value={formData.academicStatus}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="REGULAR">Regular</option>
                <option value="BACKLOG">Backlog</option>
                <option value="DETAINED">Detained</option>
                <option value="READMISSION">Re-Admission</option>
              </select>
            </div>

            <div>
              <label htmlFor="instituteCode" className="block text-sm font-medium text-gray-700">
                Institute Code
              </label>
              <input
                type="text"
                name="instituteCode"
                id="instituteCode"
                value={formData.instituteCode}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="instituteName" className="block text-sm font-medium text-gray-700">
                Institute Name
              </label>
              <input
                type="text"
                name="instituteName"
                id="instituteName"
                value={formData.instituteName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
                Course Name
              </label>
              <input
                type="text"
                name="courseName"
                id="courseName"
                value={formData.courseName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label htmlFor="branchName" className="block text-sm font-medium text-gray-700">
                Branch Name
              </label>
              <input
                type="text"
                name="branchName"
                id="branchName"
                value={formData.branchName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
