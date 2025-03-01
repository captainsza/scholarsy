import { Role } from "@prisma/client";
import { AuthUser } from "@/types";
import { formatDate } from "@/utils/dateUtils";
import Image from "next/image";

interface ProfileSummaryProps {
  data: Partial<AuthUser>;
  userRole: Role;
}

export default function ProfileSummary({ data, userRole }: ProfileSummaryProps) {
  // Format for student data
  const studentInfo = [
    { label: "Enrollment ID", value: data.student?.enrollmentId },
    { label: "Department", value: data.student?.department || data.faculty?.department },
    { label: "Gender", value: data.student?.gender },
    { label: "Date of Birth", value: data.student?.dob ? formatDate(new Date(data.student.dob)) : null },
    { label: "Blood Group", value: data.student?.bloodGroup },
    { label: "Father's Name", value: data.student?.fatherName },
    { label: "Mother's Name", value: data.student?.motherName },
    { label: "Admission Session", value: data.student?.admissionSession },
    { label: "Current Semester", value: data.student?.currentSemester },
    { label: "Academic Status", value: data.student?.academicStatus },
    { label: "Course", value: data.student?.courseName },
    { label: "Branch", value: data.student?.branchName },
    { label: "Institute", value: data.student?.instituteName },
    { label: "Institute Code", value: data.student?.instituteCode },
  ];

  // Format for faculty data
  const facultyInfo = [
    { label: "Department", value: data.faculty?.department },
    { label: "Email", value: data.email },
    { label: "Phone Number", value: data.profile?.phone },
  ];

  // Select the appropriate data structure based on user role
  const profileInfo = userRole === "STUDENT" ? studentInfo : facultyInfo;

  // Contact information (only for students)
  const contactInfo = [
    { label: "Address", value: data.student?.address },
    { label: "City", value: data.student?.city },
    { label: "State", value: data.student?.state },
    { label: "Country", value: data.student?.country },
    { label: "Pincode", value: data.student?.pincode },
  ];

  return (
    <div className="space-y-8">
      {/* Personal Information */}
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Personal Information</h3>
        <div className="border rounded-md overflow-hidden">
          <div className="bg-gray-50 px-4 py-5 sm:px-6 flex items-center space-x-4">
            <div className="relative h-16 w-16 rounded-full overflow-hidden bg-gray-100">
              {data.profile?.profileImage ? (
                <Image
                  src={data.profile.profileImage}
                  alt={`${data.profile?.firstName} ${data.profile?.lastName}`}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                  <svg className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <h4 className="text-lg font-bold text-gray-900">
                {data.profile?.firstName} {data.profile?.lastName}
              </h4>
              <p className="text-sm text-gray-500">
                {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Full name</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.profile?.firstName} {data.profile?.lastName}
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{data.email}</dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.profile?.phone || "Not provided"}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Academic Information */}
      <div>
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Academic Information</h3>
        <div className="border rounded-md overflow-hidden">
          <div className="border-t border-gray-200">
            <dl>
              {profileInfo.map((item, index) => 
                item.value ? (
                  <div 
                    key={index} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
                  >
                    <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.value}</dd>
                  </div>
                ) : null
              )}
            </dl>
          </div>
        </div>
      </div>

      {/* Contact Information - Only show for students */}
      {userRole === "STUDENT" && (
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Contact Information</h3>
          <div className="border rounded-md overflow-hidden">
            <div className="border-t border-gray-200">
              <dl>
                {contactInfo.map((item, index) => 
                  item.value ? (
                    <div 
                      key={index} 
                      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6`}
                    >
                      <dt className="text-sm font-medium text-gray-500">{item.label}</dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{item.value}</dd>
                    </div>
                  ) : null
                )}
              </dl>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
