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
  } | null;
  faculty?: Faculty | null;
  student?: Student | null;
  admin?: Admin | null;
};
