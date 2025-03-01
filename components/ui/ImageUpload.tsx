"use client";

import { useState } from 'react';

interface ImageUploadProps {
  onImageSelect: (base64: string) => void;
  onError?: (error: string) => void;
}

export default function ImageUpload({ onImageSelect, onError }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      onError?.("Image too large (max 5MB)");
      return;
    }
    
    setIsLoading(true);
    
    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      onImageSelect(base64);
      setIsLoading(false);
    };
    
    reader.onerror = () => {
      onError?.("Failed to read file");
      setIsLoading(false);
    };
    
    reader.readAsDataURL(file);
  };

  return (
    <div className="absolute bottom-0 right-0">
      <label 
        htmlFor="image-upload" 
        className="bg-blue-600 rounded-full p-2 text-white cursor-pointer shadow hover:bg-blue-700 block"
        title="Upload profile picture"
      >
        {isLoading ? (
          <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        disabled={isLoading}
      />
    </div>
  );
}
