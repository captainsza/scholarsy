"use client";

import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { AuthUser } from "@/types";
import { uploadToCloudinary } from "@/utils/cloudinary";
import Image from "next/image";
import { motion } from "framer-motion";
import PersonalInfoForm from "./PersonalInfoForm";
import AcademicInfoForm from "./AcademicInfoForm";
import ContactInfoForm from "./ContactInfoForm";
import ProfileSummary from "./ProfileSummary";
import LoadingSpinner from "../ui/LoadingSpinner";
import ErrorAlert from "../ui/ErrorAlert";
import ImageUpload from "../ui/ImageUpload";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("summary");
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileData, setProfileData] = useState<Partial<AuthUser> | null>(null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setProfileData(user);
      // Set profile image if exists
      if (user.profile?.profileImage) {
        setProfileImagePreview(user.profile.profileImage);
      }
    }
  }, [user]);

  const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // File size validation (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image too large (max 5MB)");
      return;
    }

    setProfileImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSubmit = useCallback(async (formData: any) => {
    try {
      setUpdating(true);
      setError("");
      setSuccess("");

      let imageUrl = profileData?.profile?.profileImage;

      // Upload image if a new one was selected
      if (profileImageFile) {
        try {
          // Convert File to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => resolve(reader.result as string);
          });
          reader.readAsDataURL(profileImageFile);
          const base64 = await base64Promise;

          // Upload to Cloudinary
          imageUrl = await uploadToCloudinary(base64);
        } catch (err) {
          console.error("Image upload failed:", err);
          setError("Failed to upload profile image");
          setUpdating(false);
          return;
        }
      }

      // Merge formData with profile image URL
      const updatedData = {
        ...formData,
        profile: {
          ...formData.profile,
          profileImage: imageUrl,
        }
      };
      
      // Update profile via auth context
      await updateProfile(updatedData);
      setSuccess("Profile updated successfully!");
      
      // Update local profile data
      setProfileData(prev => ({
        ...prev,
        ...updatedData,
        profile: {
          ...prev?.profile,
          ...updatedData.profile,
        }
      }));
      
    } catch (err: any) {
      console.error("Profile update error:", err);
      setError(err.message || "Failed to update profile");
    } finally {
      setUpdating(false);
    }
  }, [profileData, profileImageFile, updateProfile]);

  // Show loading state if user data is not available yet
  if (!user || !profileData) {
    return <LoadingSpinner message="Loading profile information..." />;
  }

  // Determine which tab component to render
  const renderActiveTab = () => {
    switch (activeTab) {
      case "personal":
        return (
          <PersonalInfoForm 
            data={profileData} 
            onSubmit={handleSubmit}
            loading={updating}
          />
        );
      case "academic":
        return (
          <AcademicInfoForm 
            data={profileData} 
            onSubmit={handleSubmit}
            loading={updating}
            userRole={user.role}
          />
        );
      case "contact":
        return (
          <ContactInfoForm 
            data={profileData} 
            onSubmit={handleSubmit}
            loading={updating}
          />
        );
      default:
        return <ProfileSummary data={profileData} userRole={user.role} />;
    }
  };

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Profile header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-5">
              {/* Profile Image */}
              <div className="relative">
                <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow">
                  {profileImagePreview ? (
                    <Image 
                      src={profileImagePreview} 
                      alt="Profile" 
                      width={96} 
                      height={96} 
                      className="h-full w-full object-cover" 
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center bg-gray-200 text-gray-400">
                      <svg className="h-12 w-12" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                <ImageUpload
                  onImageSelect={async (base64) => {
                    try {
                      // Set temporary preview
                      setProfileImagePreview(base64);
                      
                      // Upload to server
                      const imageUrl = await uploadToCloudinary(base64);
                      
                      // Update profile with new image URL
                      await handleSubmit({
                        profile: {
                          profileImage: imageUrl
                        }
                      });
                      
                      // Set success message
                      setSuccess("Profile image updated successfully");
                    } catch (err: any) {
                      console.error("Upload error:", err);
                      setError(err.message || "Failed to upload image");
                    }
                  }}
                  onError={(errorMsg) => setError(errorMsg)}
                />
              </div>
              
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {profileData.profile?.firstName} {profileData.profile?.lastName}
                </h3>
                <div className="mt-1 flex items-center text-gray-500">
                  <span className="capitalize">{user.role.toLowerCase()} • </span>
                  <span className="ml-1">
                    {user.role === "STUDENT" 
                      ? profileData.student?.enrollmentId
                      : profileData.faculty?.department
                    }
                  </span>
                </div>
                <div className="mt-1 text-sm text-gray-500">
                  {profileData.email}
                </div>
              </div>
            </div>
          </div>

          {/* Tab navigation */}
          <div className="border-t border-gray-200">
            <div className="px-4 sm:px-6">
              <nav className="flex space-x-8 overflow-x-auto scrollbar-hide">
                {["summary", "personal", "academic", "contact"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)} Info
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Error and success alerts */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-4"
          >
            <ErrorAlert message={error} onClose={() => setError("")} />
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-green-50 border-l-4 border-green-400 p-4"
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setSuccess("")}
                    className="inline-flex text-green-500 focus:outline-none focus:text-green-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main content */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </div>
  );
}
