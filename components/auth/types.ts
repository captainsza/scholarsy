// types.ts
export interface RegistrationData {
    // Personal Details
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    gender: string;
    phone: string;
    dob: string;
    bloodGroup: string;
    fatherName: string;
    motherName: string;
  
    // Academic Details
    enrollmentId: string;
    admissionSession: string;
    admissionSemester: string;
    academicStatus: "REGULAR" | "BACKLOG" | "DETAINED" | "READMISSION";
    instituteCode: string;
    instituteName: string;
    courseName: string;
    branchName: string;
    currentSemester: string;
    department: string;
  
    // Permanent Address
    address: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  
    role: "STUDENT" | "FACULTY" | "ADMIN";
    profileImageBase64: string;
  }
  
  export interface FormState {
    loading: boolean;
    error: string;
    currentStep: number;
  }