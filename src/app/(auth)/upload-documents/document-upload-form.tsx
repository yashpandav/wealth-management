/**
 * Document Upload Form Component
 * Handles multiple file uploads with progress indicators
 */

'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { VerificationStatus } from '@prisma/client';

// Document types for upload
const DOCUMENT_TYPES = [
  {
    id: 'IDENTITY_PROOF',
    name: 'Identity Proof (Aadhaar/Passport/Driving License)',
    description: 'Upload a clear copy of your government-issued ID',
    required: true,
  },
  {
    id: 'ADDRESS_PROOF',
    name: 'Address Proof (Utility Bill/Bank Statement)',
    description: 'Document should be less than 3 months old',
    required: true,
  },
  {
    id: 'INCOME_PROOF',
    name: 'Income Proof (Salary Slip/Tax Return)',
    description: 'Latest income proof document',
    required: false,
  },
  {
    id: 'BANK_STATEMENT',
    name: 'Bank Statement',
    description: 'Last 3 months bank statement',
    required: false,
  },
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number]['id'];

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  documentId?: string;
  description: string;
}

interface DocumentUploadFormProps {
  userEmail: string;
  userName: string;
  verificationStatus: VerificationStatus | null;
}

export function DocumentUploadForm({
  userEmail,
  userName,
  verificationStatus,
}: DocumentUploadFormProps) {
  const router = useRouter();
  const [uploads, setUploads] = useState<Record<DocumentType, FileUploadState>>(
    () =>
      DOCUMENT_TYPES.reduce(
        (acc, doc) => ({
          ...acc,
          [doc.id]: {
            file: null,
            progress: 0,
            status: 'idle',
            description: '',
          },
        }),
        {} as Record<DocumentType, FileUploadState>
      )
  );
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback(
    (documentType: DocumentType, file: File | null) => {
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setUploads((prev) => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            file: null,
            status: 'error',
            error: 'Invalid file type. Please upload JPG, PNG, or PDF.',
          },
        }));
        return;
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        setUploads((prev) => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            file: null,
            status: 'error',
            error: 'File size exceeds 5MB limit.',
          },
        }));
        return;
      }

      setUploads((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          file,
          status: 'idle',
          error: undefined,
        },
      }));
    },
    []
  );

  // Handle description change
  const handleDescriptionChange = useCallback(
    (documentType: DocumentType, description: string) => {
      setUploads((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          description,
        },
      }));
    },
    []
  );

  // Upload a single file
  const uploadFile = async (
    documentType: DocumentType,
    file: File,
    description: string
  ): Promise<boolean> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType);
    if (description) {
      formData.append('description', description);
    }

    // Simulate progress updates
    const progressInterval = setInterval(() => {
      setUploads((prev) => {
        const current = prev[documentType];
        if (current.progress < 90) {
          return {
            ...prev,
            [documentType]: {
              ...current,
              progress: current.progress + 10,
            },
          };
        }
        return prev;
      });
    }, 200);

    try {
      setUploads((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          status: 'uploading',
          progress: 10,
        },
      }));

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressInterval);

      const data = await response.json();

      if (!response.ok) {
        setUploads((prev) => ({
          ...prev,
          [documentType]: {
            ...prev[documentType],
            status: 'error',
            progress: 0,
            error: data.error || 'Upload failed',
          },
        }));
        return false;
      }

      setUploads((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          status: 'success',
          progress: 100,
          documentId: data.document?.id,
        },
      }));
      return true;
    } catch (error) {
      clearInterval(progressInterval);
      setUploads((prev) => ({
        ...prev,
        [documentType]: {
          ...prev[documentType],
          status: 'error',
          progress: 0,
          error: 'Network error. Please try again.',
        },
      }));
      return false;
    }
  };

  // Handle form submission - upload all files
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGlobalError(null);
    setIsSubmitting(true);

    // Check required documents
    const requiredDocs = DOCUMENT_TYPES.filter((d) => d.required);
    const missingRequired = requiredDocs.filter(
      (doc) => !uploads[doc.id as DocumentType].file
    );

    if (missingRequired.length > 0) {
      setGlobalError(
        `Please upload required documents: ${missingRequired.map((d) => d.name.split('(')[0].trim()).join(', ')}`
      );
      setIsSubmitting(false);
      return;
    }

    // Upload all selected files
    const uploadPromises: Promise<boolean>[] = [];

    for (const docType of DOCUMENT_TYPES) {
      const upload = uploads[docType.id as DocumentType];
      if (upload.file && upload.status !== 'success') {
        uploadPromises.push(
          uploadFile(docType.id as DocumentType, upload.file, upload.description)
        );
      }
    }

    const results = await Promise.all(uploadPromises);
    const allSuccessful = results.every((r) => r);

    setIsSubmitting(false);

    if (allSuccessful && uploadPromises.length > 0) {
      setUploadComplete(true);
    } else if (!allSuccessful) {
      setGlobalError('Some uploads failed. Please check and try again.');
    }
  };

  // Get overall progress
  const getOverallProgress = () => {
    const uploading = Object.values(uploads).filter((u) => u.status === 'uploading');
    if (uploading.length === 0) return 0;
    return uploading.reduce((sum, u) => sum + u.progress, 0) / uploading.length;
  };

  // Check if any file is selected
  const hasSelectedFiles = Object.values(uploads).some((u) => u.file);

  // If verification status is pending or under review, show status
  if (verificationStatus === 'PENDING' || verificationStatus === 'UNDER_REVIEW') {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl text-brand-blue">
            Documents Under Review
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-brand-blue/10 border-blue-200">
            <AlertTitle className="text-blue-800">Verification in Progress</AlertTitle>
            <AlertDescription className="text-brand-blue">
              Your documents have been submitted and are being reviewed by our team.
              You will receive an email notification once the verification is complete.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-brand-blue animate-pulse"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-600">
              Status: <span className="font-semibold text-brand-blue">
                {verificationStatus === 'PENDING' ? 'Pending Review' : 'Under Review'}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              This usually takes 1-2 business days.
            </p>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={() => router.push('/login')}
          >
            Back to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  // If upload is complete, show success message
  if (uploadComplete) {
    return (
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-xl text-green-600">
            Documents Uploaded Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert className="bg-green-50 border-green-200">
            <AlertTitle className="text-green-800">Upload Complete</AlertTitle>
            <AlertDescription className="text-green-700">
              Your documents have been submitted for verification. You will receive
              an email notification once the review is complete.
            </AlertDescription>
          </Alert>

          <div className="text-center space-y-4 py-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-gray-600">
              We&apos;ll notify you at <span className="font-semibold">{userEmail}</span> once
              your account is verified.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.location.reload()}
            >
              Upload More Documents
            </Button>
            <Button
              className="flex-1"
              onClick={() => router.push('/login')}
            >
              Go to Login
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle>KYC Document Upload</CardTitle>
          <CardDescription>
            Welcome, {userName}! Please upload clear, legible copies of your documents.
            Accepted formats: JPG, PNG, PDF (Max 5MB each)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {globalError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{globalError}</AlertDescription>
            </Alert>
          )}

          {/* Overall progress when uploading */}
          {isSubmitting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Uploading documents...</span>
                <span className="text-gray-600">{Math.round(getOverallProgress())}%</span>
              </div>
              <Progress value={getOverallProgress()} className="h-2" />
            </div>
          )}

          {/* Document upload fields */}
          {DOCUMENT_TYPES.map((docType) => {
            const upload = uploads[docType.id as DocumentType];
            return (
              <div
                key={docType.id}
                className={`p-4 border rounded-lg ${
                  upload.status === 'success'
                    ? 'border-green-200 bg-green-50'
                    : upload.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : 'border-gray-200'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <Label className="text-base font-medium">
                        {docType.name}
                        {docType.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </Label>
                      <p className="text-sm text-gray-500">{docType.description}</p>
                    </div>
                    {upload.status === 'success' && (
                      <span className="flex items-center text-green-600 text-sm">
                        <svg
                          className="w-5 h-5 mr-1"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Uploaded
                      </span>
                    )}
                  </div>

                  {/* File input */}
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <input
                        type="file"
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) =>
                          handleFileSelect(
                            docType.id as DocumentType,
                            e.target.files?.[0] || null
                          )
                        }
                        disabled={isSubmitting || upload.status === 'success'}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-brand-blue/10 file:text-brand-blue
                          hover:file:bg-blue-100
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>

                  {/* Selected file info */}
                  {upload.file && upload.status !== 'success' && (
                    <p className="text-sm text-gray-600">
                      Selected: {upload.file.name} (
                      {(upload.file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}

                  {/* Description field */}
                  {upload.file && upload.status !== 'success' && (
                    <Textarea
                      placeholder="Optional: Add a description for this document"
                      value={upload.description}
                      onChange={(e) =>
                        handleDescriptionChange(
                          docType.id as DocumentType,
                          e.target.value
                        )
                      }
                      disabled={isSubmitting}
                      className="h-16 text-sm"
                    />
                  )}

                  {/* Upload progress */}
                  {upload.status === 'uploading' && (
                    <div className="space-y-1">
                      <Progress value={upload.progress} className="h-1" />
                      <p className="text-xs text-gray-500">
                        Uploading... {upload.progress}%
                      </p>
                    </div>
                  )}

                  {/* Error message */}
                  {upload.status === 'error' && upload.error && (
                    <p className="text-sm text-red-600">{upload.error}</p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Submit button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => router.push('/login')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || !hasSelectedFiles}
            >
              {isSubmitting ? 'Uploading...' : 'Upload Documents'}
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-center text-gray-500">
            By uploading these documents, you agree to our verification process.
            Your documents will be securely stored and used only for verification purposes.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}
