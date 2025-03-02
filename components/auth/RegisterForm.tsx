"use client";

import { useState, useMemo, useCallback, useEffect, ChangeEvent, JSX } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FormState, RegistrationData } from "@/types";
import Image from "next/image";

const fadeInUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

interface FormInputProps {
  label: string;
  id: keyof RegistrationData;
  type?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  placeholder?: string;
  minLength?: number;
}

interface FormSelectProps {
  label: string;
  id: keyof RegistrationData;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  required?: boolean;
  options: { value: string; label: string }[];
}

const FormInput: React.FC<FormInputProps> = ({ label, id, type = "text", value, onChange, required, placeholder, ...props }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className="appearance-none text-black block w-full px-4 py-2 border border-cyan-200/50 rounded-full shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white/50"
      {...props}
    />
  </div>
);

const FormSelect: React.FC<FormSelectProps> = ({ label, id, value, onChange, required, options }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      className="block w-full px-4 py-2 border border-cyan-200/50 rounded-full shadow-sm focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white/50 text-gray-700"
    >
      {options.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  </div>
);

export default function RegisterForm() {
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<FormState>({ loading: false, error: "", currentStep: 1 });

  const [formData, setFormData] = useState<RegistrationData>(() => {
    const roleFromParam = searchParams?.get("role")?.toUpperCase();
    const validRoles = ["STUDENT", "FACULTY", "ADMIN"] as const;
    const initialRole = (validRoles.includes(roleFromParam as any) ? roleFromParam : "STUDENT") as RegistrationData["role"];
    return {
      email: "", password: "", confirmPassword: "", role: initialRole,
      firstName: "", lastName: "", gender: "", phone: "", department: "", dob: "", bloodGroup: "",
      enrollmentId: "", fatherName: "", motherName: "", admissionSession: "", admissionSemester: "", academicStatus: "REGULAR",
      instituteCode: "", instituteName: "", courseName: "", branchName: "", currentSemester: "",
      address: "", city: "", state: "", country: "India", pincode: "",
      profileImageBase64: "",
    };
  });

  const totalSteps = useMemo(() => formData.role === "STUDENT" ? 5 : 2, [formData.role]);

  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setState(prev => ({ ...prev, error: "Image must be less than 5MB" }));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, profileImageBase64: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }, []);

  const ImageUploadField = () => (
    <div className="mt-2">
      <label className="block text-sm font-medium text-gray-700 mb-1">Profile Picture</label>
      <div className="mt-1 flex items-center">
        <div className="relative inline-block h-16 w-16 rounded-full overflow-hidden bg-cyan-100/50 border border-cyan-200/50 shadow-sm">
          {formData.profileImageBase64 ? (
            <Image
              src={formData.profileImageBase64}
              alt="Profile preview"
              fill
              className="object-cover"
            />
          ) : (
            <svg className="h-full w-full text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </div>
        <label
          htmlFor="profile-image-upload"
          className="ml-4 py-2 px-3 border border-cyan-200/50 rounded-full shadow-sm text-sm font-medium text-cyan-600 bg-white/50 hover:bg-cyan-50 focus:outline-none cursor-pointer transition-all"
        >
          {formData.profileImageBase64 ? "Change" : "Upload"}
        </label>
        <input
          id="profile-image-upload"
          name="profileImage"
          type="file"
          className="sr-only"
          onChange={handleImageChange}
          accept="image/png,image/jpeg"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">PNG, JPG up to 5MB</p>
    </div>
  );

  useEffect(() => {
    if (user) router.push(`/${user.role.toLowerCase()}/dashboard`);
  }, [user, router]);

  const validateStep = useCallback((): string | null => {
    const validations: Record<number, () => string | null> = {
      1: () => !formData.email ? "Email is required" : 
        !/\S+@\S+\.\S+/.test(formData.email) ? "Email is invalid" :
        !formData.password ? "Password is required" :
        formData.password.length < 8 ? "Password must be at least 8 characters" :
        formData.password !== formData.confirmPassword ? "Passwords do not match" : null,
      2: () => !formData.firstName ? "First name is required" :
        !formData.lastName ? "Last name is required" :
        !formData.gender && formData.role === "STUDENT" ? "Gender is required" :
        !formData.department ? "Department is required" : null,
      3: () => !formData.enrollmentId ? "Enrollment ID is required" :
        !formData.fatherName ? "Father's name is required" :
        !formData.motherName ? "Mother's name is required" : null,
      4: () => !formData.instituteCode ? "Institute code is required" :
        !formData.instituteName ? "Institute name is required" : null,
      5: () => !formData.address ? "Address is required" :
        !formData.city ? "City is required" :
        !formData.state ? "State is required" : null,
    };
    return validations[state.currentStep]?.() || null;
  }, [state.currentStep, formData]);

  const handleNavigation = useCallback((direction: "next" | "prev") => {
    const error = validateStep();
    if (error && direction === "next") return setState(prev => ({ ...prev, error }));
    setState(prev => ({
      ...prev,
      error: "",
      currentStep: direction === "next" 
        ? Math.min(prev.currentStep + 1, totalSteps)
        : Math.max(prev.currentStep - 1, 1)
    }));
  }, [validateStep, totalSteps]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateStep();
    if (error) return setState(prev => ({ ...prev, error }));
    
    setState(prev => ({ ...prev, loading: true, error: "" }));
    try {
      await register(formData);
      router.push("/verify-email");
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message || "Registration failed" }));
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [formData, register, router, validateStep]);

  const stepContent = useMemo<Record<number, () => JSX.Element | null>>(() => ({
    1: () => (
      <>
        <FormInput label="Email Address" id="email" type="email" value={formData.email} onChange={handleChange} required placeholder="your.email@example.com" />
        <FormInput label="Password" id="password" type="password" value={formData.password} onChange={handleChange} required minLength={8} placeholder="••••••••" />
        <FormInput label="Confirm Password" id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required placeholder="••••••••" />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
          <div className="mt-1 flex space-x-4">
            {(["STUDENT", "FACULTY"] as const).map(role => (
              <div key={role} className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={handleChange}
                  className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-cyan-300"
                />
                <label className="ml-2 text-sm text-gray-700">{role.charAt(0) + role.slice(1).toLowerCase()}</label>
              </div>
            ))}
          </div>
        </div>
      </>
    ),
    2: () => (
      <>
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="First Name" id="firstName" value={formData.firstName} onChange={handleChange} required placeholder="John" />
          <FormInput label="Last Name" id="lastName" value={formData.lastName} onChange={handleChange} required placeholder="Doe" />
        </div>
        <ImageUploadField />
        {formData.role === "STUDENT" && (
          <FormSelect
            label="Gender"
            id="gender"
            value={formData.gender}
            onChange={handleChange}
            required
            options={[
              { value: "", label: "Select gender" },
              { value: "male", label: "Male" },
              { value: "female", label: "Female" },
              { value: "other", label: "Other" },
              { value: "prefer_not_to_say", label: "Prefer not to say" },
            ]}
          />
        )}
        <FormInput label="Phone Number" id="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+91 123-456-7890" />
        <FormInput label="Department" id="department" value={formData.department} onChange={handleChange} required placeholder="e.g., Computer Science" />
        {formData.role === "STUDENT" && (
          <>
            <FormInput label="Date of Birth" id="dob" type="date" value={formData.dob} onChange={handleChange} required />
            <FormSelect
              label="Blood Group"
              id="bloodGroup"
              value={formData.bloodGroup}
              onChange={handleChange}
              options={[
                { value: "", label: "Select blood group" },
                ...["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map(bg => ({ value: bg, label: bg })),
              ]}
            />
          </>
        )}
      </>
    ),
    3: () => formData.role === "STUDENT" ? (
      <>
        <FormInput label="Enrollment ID" id="enrollmentId" value={formData.enrollmentId} onChange={handleChange} required placeholder="e.g., CS2023001" />
        <FormInput label="Father's Name" id="fatherName" value={formData.fatherName} onChange={handleChange} required placeholder="e.g., Robert Doe" />
        <FormInput label="Mother's Name" id="motherName" value={formData.motherName} onChange={handleChange} required placeholder="e.g., Jane Doe" />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Admission Session" id="admissionSession" value={formData.admissionSession} onChange={handleChange} required placeholder="e.g., 2023-2024" />
          <FormInput label="Admission Semester" id="admissionSemester" value={formData.admissionSemester} onChange={handleChange} required placeholder="e.g., Fall" />
        </div>
        <FormSelect
          label="Academic Status"
          id="academicStatus"
          value={formData.academicStatus}
          onChange={handleChange}
          required
          options={[
            { value: "REGULAR", label: "Regular" },
            { value: "BACKLOG", label: "Backlog" },
            { value: "DETAINED", label: "Detained" },
            { value: "READMISSION", label: "Re-Admission" },
          ]}
        />
      </>
    ) : null,
    4: () => formData.role === "STUDENT" ? (
      <>
        <div className="grid grid-size-2 gap-4">
          <FormInput label="Institute Code" id="instituteCode" value={formData.instituteCode} onChange={handleChange} required placeholder="e.g., INST001" />
          <FormInput label="Institute Name" id="instituteName" value={formData.instituteName} onChange={handleChange} required placeholder="e.g., XYZ University" />
          <FormInput label="Course Name" id="courseName" value={formData.courseName} onChange={handleChange} required placeholder="e.g., B.Tech" />
          <FormInput label="Branch Name" id="branchName" value={formData.branchName} onChange={handleChange} required placeholder="e.g., Computer Science" />
        </div>
        <FormInput label="Current Semester" id="currentSemester" value={formData.currentSemester} onChange={handleChange} required placeholder="e.g., Semester 3" />
      </>
    ) : null,
    5: () => formData.role === "STUDENT" ? (
      <>
        <FormInput label="Address" id="address" value={formData.address} onChange={handleChange} required placeholder="e.g., 123 Main St" />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="City/District" id="city" value={formData.city} onChange={handleChange} required placeholder="e.g., New Delhi" />
          <FormInput label="State" id="state" value={formData.state} onChange={handleChange} required placeholder="e.g., Delhi" />
          <FormInput label="Country" id="country" value={formData.country} onChange={handleChange} required placeholder="e.g., India" />
          <FormInput label="Pincode" id="pincode" value={formData.pincode} onChange={handleChange} required placeholder="e.g., 110001" />
        </div>
      </>
    ) : null,
  }), [formData, handleChange, ImageUploadField]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 to-blue-100">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="w-16 h-16 border-4 border-t-cyan-500 border-r-blue-500 border-b-transparent border-l-transparent rounded-full"
          />
          <p className="mt-4 text-cyan-600 font-semibold text-lg">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-cyan-50/50 to-blue-100/50 overflow-hidden">
      {/* Left Side - Registration Form */}
      <div className="flex-1 py-12 px-4 sm:px-6 lg:px-8 md:max-w-xl">
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="max-w-md mx-auto space-y-6"
        >
          <motion.h2
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center text-3xl font-extrabold text-gray-900"
          >
            Create Your{" "}
            <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">
              ScholarSync
            </span>{" "}
            Account
          </motion.h2>
          <div className="text-center text-md text-gray-600">
            Step {state.currentStep} of {totalSteps}
            <div className="w-full max-w-xs mt-3 mx-auto">
              <div className="bg-cyan-200/30 rounded-full h-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full"
                  animate={{ width: `${(state.currentStep / totalSteps) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {state.error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-red-50/80 backdrop-blur-sm border-l-4 border-red-500 text-red-700 p-4 rounded-xl shadow-md"
              >
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-sm">{state.error}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white/80 backdrop-blur-md p-6 rounded-xl shadow-xl border border-cyan-100/50"
          >
            <form onSubmit={state.currentStep === totalSteps ? handleSubmit : e => e.preventDefault()} className="space-y-5">
              <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                {stepContent[state.currentStep]?.()}
              </motion.div>
              <div className="flex justify-between pt-4">
                {state.currentStep > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => handleNavigation("prev")}
                    className="px-4 py-2 border border-cyan-200/50 rounded-full shadow-sm text-sm font-medium text-cyan-600 bg-white/50 hover:bg-cyan-50 transition-all"
                  >
                    Back
                  </motion.button>
                )}
                <div className="flex-1" />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type={state.currentStep === totalSteps ? "submit" : "button"}
                  onClick={state.currentStep < totalSteps ? () => handleNavigation("next") : undefined}
                  disabled={state.loading}
                  className="px-4 py-2 border border-transparent rounded-full shadow-md text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-70 transition-all"
                >
                  {state.loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Submitting...
                    </>
                  ) : state.currentStep === totalSteps ? "Register" : "Next"}
                </motion.button>
              </div>
            </form>
          </motion.div>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-cyan-600 hover:text-cyan-700">
              Log in here
            </Link>
          </p>
        </motion.div>
      </div>

      {/* Right Side - Illustration */}
      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, delay: 0.3 }}
        className="hidden md:flex flex-1 items-center justify-center p-8 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 backdrop-blur-sm"
      >
        <div className="max-w-md text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              Join ScholarSync
            </h3>
            <p className="text-gray-700 mb-6">
              Start your academic journey with a platform designed for success.
            </p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {[
                { title: "Profile Setup", color: "cyan" },
                { title: "Course Access", color: "blue" },
                { title: "Progress Tracking", color: "indigo" },
                { title: "Community", color: "purple" },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  className={`bg-${feature.color}-50/50 backdrop-blur-sm border-${feature.color}-200/50 border rounded-lg p-4 shadow-sm`}
                >
                  <div className={`text-${feature.color}-600 font-medium`}>{feature.title}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.6, type: "spring" }}
            className="relative w-full h-64 rounded-xl overflow-hidden shadow-xl"
          >
            <Image
              src="/dashboard.png" // Replace with your image path
              alt="ScholarSync Registration"
              fill
              className="object-cover opacity-90"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-blue-600/20" />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}