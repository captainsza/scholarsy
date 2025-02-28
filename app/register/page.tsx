"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Register() {
  const { register, user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  // For students we need more steps to handle the additional fields
  const [totalSteps, setTotalSteps] = useState(2);
  
  const [formData, setFormData] = useState({
    // Account information
    email: "",
    password: "",
    confirmPassword: "",
    role: "STUDENT", // Default role
    
    // Basic profile
    firstName: "",
    lastName: "",
    gender: "", // Added gender field
    phone: "",
    department: "",
    dob: "", // Added date of birth
    bloodGroup: "", // Added blood group
    
    // Student-specific information
    enrollmentId: "",
    fatherName: "", // Added father's name
    motherName: "", // Added mother's name
    admissionSession: "", // Added admission session
    admissionSemester: "", // Added admission semester
    academicStatus: "REGULAR", // Added academic status with default
    
    // Educational details
    instituteCode: "", // Added institute code
    instituteName: "", // Added institute name
    courseName: "", // Added course name
    branchName: "", // Added branch name
    currentSemester: "", // Added current semester
    
    // Contact details
    address: "", // Added address
    city: "", // Added city/district
    state: "", // Added state
    country: "India", // Added country with default
    pincode: "", // Added pincode
  });

  // Update total steps when role changes
  useEffect(() => {
    if (formData.role === "STUDENT") {
      setTotalSteps(5); // More steps for students
    } else {
      setTotalSteps(2); // Fewer steps for faculty/admin
    }
  }, [formData.role]);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === "ADMIN") router.push("/admin/dashboard");
      else if (user.role === "FACULTY") router.push("/faculty/dashboard");
      else if (user.role === "STUDENT") router.push("/student/dashboard");
    }
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (!formData.email) return "Email is required";
        if (!/\S+@\S+\.\S+/.test(formData.email)) return "Email is invalid";
        if (!formData.password) return "Password is required";
        if (formData.password.length < 8) return "Password must be at least 8 characters";
        if (formData.password !== formData.confirmPassword) return "Passwords do not match";
        return null;
        
      case 2:
        if (!formData.firstName) return "First name is required";
        if (!formData.lastName) return "Last name is required";
        if (!formData.gender && formData.role === "STUDENT") return "Gender is required";
        if (!formData.department) return "Department is required";
        if (!formData.dob && formData.role === "STUDENT") return "Date of birth is required";
        return null;
        
      case 3: // Student specific fields - Family info
        if (!formData.enrollmentId) return "Enrollment ID is required";
        if (!formData.fatherName) return "Father's name is required";
        if (!formData.motherName) return "Mother's name is required";
        if (!formData.admissionSession) return "Admission session is required";
        if (!formData.admissionSemester) return "Admission semester is required";
        return null;
        
      case 4: // Student specific fields - Educational details
        if (!formData.instituteCode) return "Institute code is required";
        if (!formData.instituteName) return "Institute name is required";
        if (!formData.courseName) return "Course name is required";
        if (!formData.branchName) return "Branch name is required";
        if (!formData.currentSemester) return "Current semester is required";
        return null;
        
      case 5: // Student specific fields - Contact details
        if (!formData.address) return "Address is required";
        if (!formData.city) return "City is required";
        if (!formData.state) return "State is required";
        if (!formData.country) return "Country is required";
        if (!formData.pincode) return "Pincode is required";
        return null;
        
      default:
        return null;
    }
  };

  const handleNextStep = () => {
    const error = validateCurrentStep();
    if (error) {
      setError(error);
      return;
    }
    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const handlePrevStep = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    const error = validateCurrentStep();
    if (error) {
      setError(error);
      return;
    }

    try {
      setLoading(true);
      await register(formData);
      router.push("/verify-email");
    } catch (error: any) {
      setError(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // If already authenticated or checking auth status, show loading
  if (authLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
          className="flex flex-col items-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-blue-600 font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Helper function to get step title based on current step and role
  const getStepTitle = () => {
    if (formData.role === "STUDENT") {
      switch (currentStep) {
        case 1: return "Account Setup";
        case 2: return "Personal Information";
        case 3: return "Family Information";
        case 4: return "Educational Details";
        case 5: return "Contact Information";
        default: return "Registration";
      }
    } else {
      switch (currentStep) {
        case 1: return "Account Setup";
        case 2: return "Professional Information";
        default: return "Registration";
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50">
      {/* Left side - Registration Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 md:max-w-md lg:max-w-lg xl:max-w-xl">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100 }}
          className="max-w-md w-full mx-auto space-y-8"
        >
          <div>
            <motion.h2
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-6 text-center text-4xl font-extrabold text-gray-900"
            >
              Create your account
            </motion.h2>
            <motion.p
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mt-2 text-center text-md text-gray-600"
            >
              Step {currentStep} of {totalSteps}: {getStepTitle()}
            </motion.p>
          </div>

          {/* Step indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="flex justify-between mt-2 text-xs text-gray-500">
              <span>Start</span>
              <span>Finish</span>
            </div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow"
              role="alert"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="bg-white py-8 px-6 shadow-xl rounded-lg sm:px-10 backdrop-blur-sm bg-opacity-80 border border-gray-100"
          >
            <form className="mb-0 space-y-6" onSubmit={currentStep === totalSteps ? handleSubmit : (e) => e.preventDefault()}>
              {/* Step 1: Account Setup (All Roles) */}
              {currentStep === 1 && (
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="your.email@example.com"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="••••••••"
                        minLength={8}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Password must be at least 8 characters long
                    </p>
                  </div>
                  
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                      Confirm Password
                    </label>
                    <div className="mt-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                      I am a
                    </label>
                    <div className="mt-1 flex space-x-4">
                      <div className="flex items-center">
                        <input
                          id="role-student"
                          name="role"
                          type="radio"
                          value="STUDENT"
                          checked={formData.role === "STUDENT"}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="role-student" className="ml-2 block text-sm text-gray-700">
                          Student
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          id="role-faculty"
                          name="role"
                          type="radio"
                          value="FACULTY"
                          checked={formData.role === "FACULTY"}
                          onChange={handleChange}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label htmlFor="role-faculty" className="ml-2 block text-sm text-gray-700">
                          Faculty
                        </label>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Personal Information (All Roles) */}
              {currentStep === 2 && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <input
                        id="firstName"
                        name="firstName"
                        type="text"
                        required
                        value={formData.firstName}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="First Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <input
                        id="lastName"
                        name="lastName"
                        type="text"
                        required
                        value={formData.lastName}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Last Name"
                      />
                    </div>
                  </div>
                  
                  {formData.role === "STUDENT" && (
                    <div>
                      <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                        Gender
                      </label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full  text-black pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>
                  )}
                  
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Phone Number"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700">
                      Department
                    </label>
                    <input
                      id="department"
                      name="department"
                      type="text"
                      required
                      value={formData.department}
                      onChange={handleChange}
                      className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Department"
                    />
                  </div>
                  
                  {formData.role === "STUDENT" && (
                    <>
                      <div>
                        <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                          Date of Birth
                        </label>
                        <input
                          id="dob"
                          name="dob"
                          type="date"
                          required
                          value={formData.dob}
                          onChange={handleChange}
                          className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    
                      <div>
                        <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700">
                          Blood Group
                        </label>
                        <select
                          id="bloodGroup"
                          name="bloodGroup"
                          value={formData.bloodGroup}
                          onChange={handleChange}
                          className="mt-1 block w-full  text-black pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                        >
                          <option value="">Select blood group</option>
                          <option value="A+">A+</option>
                          <option value="A-">A-</option>
                          <option value="B+">B+</option>
                          <option value="B-">B-</option>
                          <option value="AB+">AB+</option>
                          <option value="AB-">AB-</option>
                          <option value="O+">O+</option>
                          <option value="O-">O-</option>
                        </select>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
              
              {/* Step 3: Family Information (Student Only) */}
              {currentStep === 3 && formData.role === "STUDENT" && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="enrollmentId" className="block text-sm font-medium text-gray-700">
                      Enrollment ID
                    </label>
                    <input
                      id="enrollmentId"
                      name="enrollmentId"
                      type="text"
                      required
                      value={formData.enrollmentId}
                      onChange={handleChange}
                      className="mt-1 appearance-none block  text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Enrollment ID"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="fatherName" className="block text-sm font-medium text-gray-700">
                      Father's Name
                    </label>
                    <input
                      id="fatherName"
                      name="fatherName"
                      type="text"
                      required
                      value={formData.fatherName}
                      onChange={handleChange}
                      className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Father's Name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="motherName" className="block text-sm font-medium text-gray-700">
                      Mother's Name
                    </label>
                    <input
                      id="motherName"
                      name="motherName"
                      type="text"
                      required
                      value={formData.motherName}
                      onChange={handleChange}
                      className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Mother's Name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="admissionSession" className="block text-sm font-medium text-gray-700">
                        Admission Session
                      </label>
                      <input
                        id="admissionSession"
                        name="admissionSession"
                        type="text"
                        required
                        value={formData.admissionSession}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. 2023-24"
                      />
                    </div>
                    <div>
                      <label htmlFor="admissionSemester" className="block text-sm font-medium text-gray-700">
                        Admission Semester
                      </label>
                      <input
                        id="admissionSemester"
                        name="admissionSemester"
                        type="text"
                        required
                        value={formData.admissionSemester}
                        onChange={handleChange}
                        className="mt-1 appearance-none block  text-black w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="e.g. 1st"
                      />
                    </div>
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
                      required
                      className="mt-1 block w-full pl-3  text-black pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                    >
                      <option value="REGULAR">Regular</option>
                      <option value="BACKLOG">Backlog</option>
                      <option value="DETAINED">Detained</option>
                      <option value="READMISSION">Re-Admission</option>
                    </select>
                  </div>
                </motion.div>
              )}
              
              {/* Step 4: Educational Details (Student Only) */}
              {currentStep === 4 && formData.role === "STUDENT" && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="instituteCode" className="block text-sm font-medium text-gray-700">
                        Institute Code
                      </label>
                      <input
                        id="instituteCode"
                        name="instituteCode"
                        type="text"
                        required
                        value={formData.instituteCode}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Institute Code"
                      />
                    </div>
                    <div>
                      <label htmlFor="instituteName" className="block text-sm font-medium text-gray-700">
                        Institute Name
                      </label>
                      <input
                        id="instituteName"
                        name="instituteName"
                        type="text"
                        required
                        value={formData.instituteName}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Institute Name"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="courseName" className="block text-sm font-medium text-gray-700">
                        Course Name
                      </label>
                      <input
                        id="courseName"
                        name="courseName"
                        type="text"
                        required
                        value={formData.courseName}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Course Name"
                      />
                    </div>
                    <div>
                      <label htmlFor="branchName" className="block text-sm font-medium text-gray-700">
                        Branch Name
                      </label>
                      <input
                        id="branchName"
                        name="branchName"
                        type="text"
                        required
                        value={formData.branchName}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Branch Name"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="currentSemester" className="block text-sm font-medium text-gray-700">
                      Current Semester
                    </label>
                    <input
                      id="currentSemester"
                      name="currentSemester"
                      type="text"
                      required
                      value={formData.currentSemester}
                      onChange={handleChange}
                      className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Current Semester"
                    />
                  </div>
                </motion.div>
              )}
              
              {/* Step 5: Contact Information (Student Only) */}
              {currentStep === 5 && formData.role === "STUDENT" && (
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="space-y-4"
                >
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Address"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                        City/District
                      </label>
                      <input
                        id="city"
                        name="city"
                        type="text"
                        required
                        value={formData.city}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="City/District"
                      />
                    </div>
                    <div>
                      <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                        State
                      </label>
                      <input
                        id="state"
                        name="state"
                        type="text"
                        required
                        value={formData.state}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="State"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                        Country
                      </label>
                      <input
                        id="country"
                        name="country"
                        type="text"
                        required
                        value={formData.country}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Country"
                      />
                    </div>
                    <div>
                      <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                        Pincode
                      </label>
                      <input
                        id="pincode"
                        name="pincode"
                        type="text"
                        required
                        value={formData.pincode}
                        onChange={handleChange}
                        className="mt-1 appearance-none  text-black block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Pincode"
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex justify-between">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="group relative w-1/3  flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="group relative w-1/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="group relative w-1/3 flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {loading ? "Registering..." : "Register"}
                  </button>
                )}
              </div>
            </form>
          </motion.div>
        </motion.div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring", 
            stiffness: 260, 
            damping: 20 
          }}
          className="text-white text-center"
        >
          <h2 className="text-4xl font-extrabold mb-4">Welcome to ScholarSync</h2>
          <p className="text-lg">Your journey to academic excellence starts here.</p>
        </motion.div>
      </div>
    </div>
  );
}
