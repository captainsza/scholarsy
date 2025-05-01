"use client";

import React, { useState, useRef, ChangeEvent } from 'react';
import { X, Upload, File, FileText, Image, Film, Paperclip } from 'lucide-react';
import { Button } from './button';

interface FileUploadFieldProps {
  onFileChange: (files: FileItem[]) => void;
  initialFiles?: FileItem[];
  maxFiles?: number;
  acceptedFileTypes?: string;
  maxSizeInMB?: number;
  label?: string;
}

export interface FileItem {
  name: string;
  type: string;
  size: number;
  data?: string; // base64 data for new uploads
  url?: string;  // URL for existing files
}

export function FileUploadField({
  onFileChange,
  initialFiles = [],
  maxFiles = 5,
  acceptedFileTypes = "application/pdf,image/*,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation",
  maxSizeInMB = 10,
  label = "Upload Files"
}: FileUploadFieldProps) {
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    processFiles(selectedFiles);
    
    // Reset input value so the same file can be uploaded again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processFiles = (selectedFiles: File[]) => {
    // Check if max files would be exceeded
    if (files.length + selectedFiles.length > maxFiles) {
      setError(`You can upload a maximum of ${maxFiles} files`);
      return;
    }

    // Process each file
    Promise.all(
      selectedFiles.map(file => {
        // Check file size
        if (file.size > maxSizeInMB * 1024 * 1024) {
          setError(`File "${file.name}" exceeds the maximum size of ${maxSizeInMB}MB`);
          return null;
        }

        return new Promise<FileItem | null>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve({
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result as string
            });
          };
          reader.onerror = () => {
            setError(`Failed to read file "${file.name}"`);
            resolve(null);
          };
          reader.readAsDataURL(file);
        });
      })
    ).then(results => {
      const validFiles = results.filter(Boolean) as FileItem[];
      if (validFiles.length) {
        const updatedFiles = [...files, ...validFiles];
        setFiles(updatedFiles);
        onFileChange(updatedFiles);
        setError(null);
      }
    });
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    onFileChange(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  // Helper to get icon based on file type
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image')) return <Image size={16} className="mr-2 text-blue-500" />;
    if (fileType.includes('pdf')) return <FileText size={16} className="mr-2 text-red-500" />;
    if (fileType.includes('video')) return <Film size={16} className="mr-2 text-purple-500" />;
    if (fileType.includes('word') || fileType.includes('document')) 
      return <File size={16} className="mr-2 text-blue-700" />;
    if (fileType.includes('sheet') || fileType.includes('excel')) 
      return <File size={16} className="mr-2 text-green-600" />;
    if (fileType.includes('presentation') || fileType.includes('powerpoint')) 
      return <File size={16} className="mr-2 text-orange-500" />;
    return <Paperclip size={16} className="mr-2 text-gray-500" />;
  };

  // Function to format file size
  const formatFileSize = (sizeInBytes: number): string => {
    if (sizeInBytes < 1024) return `${sizeInBytes} B`;
    if (sizeInBytes < 1024 * 1024) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
    return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      {/* File Input Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept={acceptedFileTypes}
          multiple
          className="hidden"
        />
        <Upload className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">{label}</p>
        <p className="mt-1 text-xs text-gray-500">
          Drag & drop files here, or click to browse
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Max {maxFiles} files, up to {maxSizeInMB}MB each
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Attached Files</h4>
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li 
                key={index} 
                className="flex items-center justify-between py-2 px-3 text-sm bg-gray-50 border border-gray-200 rounded-md"
              >
                <div className="flex items-center overflow-hidden">
                  {getFileIcon(file.type)}
                  <span className="truncate max-w-[180px] sm:max-w-xs">{file.name}</span>
                  {file.size && (
                    <span className="ml-2 text-xs text-gray-500">
                      ({formatFileSize(file.size)})
                    </span>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="h-7 w-7 p-0 rounded-full text-gray-500 hover:text-red-500"
                  onClick={(e) => { 
                    e.stopPropagation();
                    removeFile(index);
                  }}
                >
                  <X size={16} />
                </Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
