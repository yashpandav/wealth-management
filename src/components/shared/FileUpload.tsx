'use client';

/**
 * File Upload Component
 * Reusable file upload with drag-and-drop, validation, and progress
 */

import { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

interface FileUploadProps {
  label?: string;
  accept?: string;
  maxSize?: number; // in bytes
  currentFile?: string | null;
  onFileUploaded: (url: string) => void;
  onFileDeleted?: () => void;
  uploadEndpoint?: string;
  deleteEndpoint?: string;
  disabled?: boolean;
}

export function FileUpload({
  label = 'Upload File',
  accept = '.pdf',
  maxSize = 10 * 1024 * 1024, // 10MB default
  currentFile,
  onFileUploaded,
  onFileDeleted,
  uploadEndpoint = '/api/admin/instruments/upload',
  deleteEndpoint = '/api/admin/instruments/upload',
  disabled = false,
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const uploadFile = useCallback(async (file: File) => {
    // Validate file type
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const acceptedExtensions = accept.split(',').map((ext) => ext.trim().replace('.', ''));

    if (!fileExtension || !acceptedExtensions.includes(fileExtension)) {
      toast.error(`Invalid file type. Accepted: ${accept}`);
      return;
    }

    // Validate file size
    if (file.size > maxSize) {
      toast.error(`File size exceeds maximum limit of ${maxSize / 1024 / 1024}MB`);
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to upload file');
        return;
      }

      toast.success('File uploaded successfully');
      onFileUploaded(result.data.url);
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [accept, maxSize, uploadEndpoint, onFileUploaded]);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        await uploadFile(files[0]);
      }
    },
    [disabled, uploadFile]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        await uploadFile(files[0]);
      }
      // Reset input
      e.target.value = '';
    },
    [uploadFile]
  );

  const handleDelete = async () => {
    if (!currentFile || !onFileDeleted) return;

    try {
      const response = await fetch(`${deleteEndpoint}?url=${encodeURIComponent(currentFile)}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || 'Failed to delete file');
        return;
      }

      toast.success('File deleted successfully');
      onFileDeleted();
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}

      {currentFile ? (
        // Display current file with actions
        <div className="rounded-lg border border-input bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10">
                <svg
                  className="h-5 w-5 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium">Prospectus Document</p>
                <p className="text-xs text-muted-foreground">{currentFile.split('/').pop()}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <a href={currentFile} target="_blank" rel="noopener noreferrer">
                  View
                </a>
              </Button>
              {onFileDeleted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDelete}
                  disabled={disabled}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Delete
                </Button>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Upload area
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            relative rounded-lg border-2 border-dashed p-8 text-center transition-colors
            ${isDragging ? 'border-primary bg-primary/5' : 'border-input'}
            ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-primary/50'}
          `}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileSelect}
            disabled={disabled || isUploading}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="File upload input"
          />

          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-primary/10 p-3">
              <svg
                className="h-6 w-6 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>

            {isUploading ? (
              <div className="w-full space-y-2">
                <p className="text-sm font-medium">Uploading...</p>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            ) : (
              <>
                <p className="text-sm font-medium">
                  {isDragging ? 'Drop file here' : 'Drag & drop file here or click to browse'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Accepted: {accept} • Max size: {maxSize / 1024 / 1024}MB
                </p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
