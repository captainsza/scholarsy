"use client";

import { useState, useMemo, useCallback, useEffect, ChangeEvent, JSX } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { FormState, RegistrationData } from "@/types";
import { CLASSNAMES, IMAGE_UPLOAD } from "@/constants/reg_styles";
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
    <label htmlFor={id} className={CLASSNAMES.label}>{label}</label>
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      className={CLASSNAMES.input}
      {...props}
    />
  </div>
);

const FormSelect: React.FC<FormSelectProps> = ({ label, id, value, onChange, required, options }) => (
  <div>
    <label htmlFor={id} className={CLASSNAMES.label}>{label}</label>
    <select
      id={id}
      name={id}
      value={value}
      onChange={onChange}
      required={required}
      className={CLASSNAMES.select}
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
    const roleFromParam = searchParams?.get('role')?.toUpperCase();
    const validRoles = ['STUDENT', 'FACULTY', 'ADMIN'] as const;
    const initialRole = (validRoles.includes(roleFromParam as any) ? roleFromParam : 'STUDENT') as RegistrationData['role'];
    
    return {
      email: "", password: "", confirmPassword: "", role: initialRole,
      firstName: "", lastName: "", gender: "", phone: "", department: "", dob: "", bloodGroup: "",
      enrollmentId: "", fatherName: "", motherName: "", admissionSession: "", admissionSemester: "", academicStatus: "REGULAR",
      instituteCode: "", instituteName: "", courseName: "", branchName: "", currentSemester: "",
      address: "", city: "", state: "", country: "India", pincode: "",
      profileImageBase64: "",
    };
  });

  // ... rest of the component code remains the same ...
  // Copy the rest of the Register component (handleChange, handleImageChange, useEffect, etc.)

  const totalSteps = useMemo(() => formData.role === "STUDENT" ? 5 : 2, [formData.role]);
  
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleImageChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size
    if (file.size > IMAGE_UPLOAD.maxSize) {
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
      <label className={CLASSNAMES.label}>Profile Picture</label>
      <div className="mt-1 flex items-center">
        <div className="relative inline-block h-16 w-16 rounded-full overflow-hidden bg-gray-200">
          {formData.profileImageBase64 ? (
            <Image
              src={formData.profileImageBase64}
              alt="Profile preview"
              fill
              className="object-cover"
            />
          ) : (
            <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </div>
        <label
          htmlFor="profile-image-upload"
          className="ml-4 py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none cursor-pointer"
        >
          {formData.profileImageBase64 ? "Change" : "Upload"}
        </label>
        <input
          id="profile-image-upload"
          name="profileImage"
          type="file"
          className={CLASSNAMES.fileInput}
          onChange={handleImageChange}
          accept={IMAGE_UPLOAD.acceptedTypes}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        PNG, JPG up to 5MB
      </p>
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
        <FormInput label="Email address" id="email" type="email" value={formData.email} onChange={handleChange} required />
        <FormInput label="Password" id="password" type="password" value={formData.password} onChange={handleChange} required minLength={8} />
        <FormInput label="Confirm Password" id="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} required />
        <div>
          <label className={CLASSNAMES.label}>I am a</label>
          <div className="mt-1 flex space-x-4">
            {(["STUDENT", "FACULTY"] as const).map(role => (
              <div key={role} className="flex items-center">
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={formData.role === role}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600"
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
          <FormInput label="First Name" id="firstName" value={formData.firstName} onChange={handleChange} required />
          <FormInput label="Last Name" id="lastName" value={formData.lastName} onChange={handleChange} required />
        </div>
        
        <ImageUploadField />
        
        {/* Other form fields remain the same */}
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
        <FormInput label="Phone Number" id="phone" type="tel" value={formData.phone} onChange={handleChange} />
        <FormInput label="Department" id="department" value={formData.department} onChange={handleChange} required />
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
    // ... Steps 3-5 remain the same
    3: () => formData.role === "STUDENT" ? (
      <>
        <FormInput label="Enrollment ID" id="enrollmentId" value={formData.enrollmentId} onChange={handleChange} required />
        <FormInput label="Father's Name" id="fatherName" value={formData.fatherName} onChange={handleChange} required />
        <FormInput label="Mother's Name" id="motherName" value={formData.motherName} onChange={handleChange} required />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Admission Session" id="admissionSession" value={formData.admissionSession} onChange={handleChange} required />
          <FormInput label="Admission Semester" id="admissionSemester" value={formData.admissionSemester} onChange={handleChange} required />
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
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="Institute Code" id="instituteCode" value={formData.instituteCode} onChange={handleChange} required />
          <FormInput label="Institute Name" id="instituteName" value={formData.instituteName} onChange={handleChange} required />
          <FormInput label="Course Name" id="courseName" value={formData.courseName} onChange={handleChange} required />
          <FormInput label="Branch Name" id="branchName" value={formData.branchName} onChange={handleChange} required />
        </div>
        <FormInput label="Current Semester" id="currentSemester" value={formData.currentSemester} onChange={handleChange} required />
      </>
    ) : null,
    5: () => formData.role === "STUDENT" ? (
      <>
        <FormInput label="Address" id="address" value={formData.address} onChange={handleChange} required />
        <div className="grid grid-cols-2 gap-4">
          <FormInput label="City/District" id="city" value={formData.city} onChange={handleChange} required />
          <FormInput label="State" id="state" value={formData.state} onChange={handleChange} required />
          <FormInput label="Country" id="country" value={formData.country} onChange={handleChange} required />
          <FormInput label="Pincode" id="pincode" value={formData.pincode} onChange={handleChange} required />
        </div>
      </>
    ) : null,
  }), [formData, handleChange, ImageUploadField]);

  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-blue-600">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-blue-50 to-blue-50">
      <div className="flex-1 py-8 px-4 md:max-w-xl">
        <motion.div initial={{ x: -30, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="max-w-md mx-auto space-y-6">
          <motion.h2 initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </motion.h2>
          <div className="text-center text-md text-gray-600">
            Step {state.currentStep} of {totalSteps}
            <div className="w-full max-w-xs mt-3 mx-auto">
              <div className="bg-gray-200 rounded-full h-2">
                <motion.div 
                  className="h-full bg-blue-600 rounded-full"
                  animate={{ width: `${(state.currentStep / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <AnimatePresence>
            {state.error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md">
                <p className="text-sm">{state.error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div className="bg-white p-6 shadow-lg rounded-lg">
            <form onSubmit={state.currentStep === totalSteps ? handleSubmit : e => e.preventDefault()} className="space-y-5">
              <motion.div initial="hidden" animate="visible" variants={fadeInUp}>
                {stepContent[state.currentStep]?.()}
              </motion.div>
              <div className="flex justify-between pt-4">
                {state.currentStep > 1 && (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    type="button"
                    onClick={() => handleNavigation("prev")}
                    className={`${CLASSNAMES.button} text-blue-600 bg-white hover:bg-gray-50`}
                  >
                    Back
                  </motion.button>
                )}
                <div className="flex-1" />
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  type={state.currentStep === totalSteps ? "submit" : "button"}
                  onClick={state.currentStep < totalSteps ? () => handleNavigation("next") : undefined}
                  disabled={state.loading}
                  className={`${CLASSNAMES.button} text-white bg-blue-600 hover:bg-blue-700`}
                >
                  {state.loading ? "Submitting..." : state.currentStep === totalSteps ? "Register" : "Next"}
                </motion.button>
              </div>
            </form>
          </motion.div>
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-600 hover:text-blue-500">Log in</Link>
          </p>
        </motion.div>
      </div>

      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center text-white p-8 max-w-lg">
          <h2 className="text-4xl font-extrabold mb-6">Welcome to ScholarSync</h2>
          <p className="text-xl mb-8">Your journey to academic excellence starts here.</p>
          <div className="relative h-64 w-64 mx-auto">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: "linear" }}>
              <img src="/logo.png" alt="ScholarSync Logo" className="w-full h-full object-cover rounded-full" />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
