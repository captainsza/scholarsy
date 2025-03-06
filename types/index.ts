import { User as PrismaUser, Profile, Faculty, Student, Admin, Role } from '@prisma/client';

// Define the user with all possible relations
export type UserWithRelations = PrismaUser & {
  profile?: Profile | null;
  faculty?: Faculty | null;
  student?: Student | null;
  admin?: Admin | null;
};

// Safe user type that excludes the password
export type SafeUser = Omit<UserWithRelations, 'password'>;

// Auth context user type
export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  isApproved: boolean;
  emailVerified: boolean;
  profile?: {
    firstName: string;
    lastName: string;
    phone?: string | null;
    profileImage?: string | null; // Added profileImage field
  } | null;
  faculty?: Faculty | null;
  student?: Student | null;
  admin?: Admin | null;
};

// For registration
export interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  role: "STUDENT" | "FACULTY" | "ADMIN";
  firstName: string;
  lastName: string;
  gender: string;
  phone: string;
  department: string;
  dob: string;
  bloodGroup: string;
  enrollmentId: string;
  fatherName: string;
  motherName: string;
  admissionSession: string;
  admissionSemester: string;
  academicStatus: "REGULAR" | "BACKLOG" | "DETAINED" | "READMISSION";
  instituteName: string;
  courseName: string;
  branchName: string;
  currentSemester: string;
  address: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  profileImageBase64?: string; // Add this line
}



export interface FormState {
  loading: boolean;
  error: string;
  currentStep: number;
}