/**
 * KYC Documents Panel Component
 * Displays client's Index Proof document with status and upload functionality
 */

'use client';

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { VerificationStatus } from '@prisma/client';
import { formatFileSize } from '@/lib/utils';

// Single document type
const DOCUMENT_TYPE = {
  id: 'IDENTITY_PROOF',
  name: 'Identity Proof',
  description: 'Aadhaar/Passport/Driving License',
  required: true,
};

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  description: string | null;
  verificationStatus: string;
  uploadedAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
}

interface DocumentsResponse {
  success: boolean;
  data: {
    identityProof: Document | null;
    kycStatus: VerificationStatus;
  };
  error?: string;
}

interface FileUploadState {
  file: File | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  error?: string;
  description: string;
}

async function fetchDocuments(): Promise<DocumentsResponse> {
  const response = await fetch('/api/documents');
  if (!response.ok) {
    throw new Error('Failed to fetch documents');
  }
  return response.json();
}

async function uploadDocument(
  file: File,
  description: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', DOCUMENT_TYPE.id);
  if (description) {
    formData.append('description', description);
  }

  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Upload failed');
  }

  return response.json();
}

export function KYCDocumentsPanel() {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
    description: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    refetchInterval: 30000,
  });

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      description,
    }: {
      file: File;
      description: string;
    }) => uploadDocument(file, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadState({
        file: null,
        progress: 0,
        status: 'success',
        description: '',
      });
      setTimeout(() => {
        setIsUploading(false);
        setUploadState({
          file: null,
          progress: 0,
          status: 'idle',
          description: '',
        });
      }, 2000);
    },
    onError: (error: Error) => {
      setUploadState((prev) => ({
        ...prev,
        status: 'error',
        error: error.message,
        progress: 0,
      }));
    },
  });

  const handleFileSelect = useCallback((file: File | null) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadState((prev) => ({
        ...prev,
        file: null,
        status: 'error',
        error: 'Invalid file type. Please upload JPG, PNG, or PDF.',
      }));
      return;
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadState((prev) => ({
        ...prev,
        file: null,
        status: 'error',
        error: 'File size exceeds 5MB limit.',
      }));
      return;
    }

    setUploadState({
      file,
      progress: 0,
      status: 'idle',
      description: '',
    });
  }, []);

  const handleUpload = async () => {
    if (!uploadState.file) return;

    setUploadState((prev) => ({ ...prev, status: 'uploading', progress: 10 }));

    const progressInterval = setInterval(() => {
      setUploadState((prev) =>
        prev.progress < 90
          ? { ...prev, progress: prev.progress + 10 }
          : prev
      );
    }, 200);

    try {
      await uploadMutation.mutateAsync({
        file: uploadState.file,
        description: uploadState.description,
      });
    } finally {
      clearInterval(progressInterval);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Verified
          </Badge>
        );
      case 'REJECTED':
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      case 'UNDER_REVIEW':
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-brand-blue/10">
            <Clock className="mr-1 h-3 w-3" />
            Under Review
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        );
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="Loading documents..." />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load documents. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  const identityProof = data?.data.identityProof;
  const kycStatus = data?.data.kycStatus;

  // Show banner if Identity Proof is under review
  const showUnderReviewBanner = kycStatus === 'PENDING' || kycStatus === 'UNDER_REVIEW' || (identityProof?.verificationStatus === 'PENDING');

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">KYC Documents</h2>
        <p className="text-muted-foreground mt-1">
          Upload your Identity Proof (Aadhaar/Passport/Driving License) to complete verification.
        </p>
      </div>

      {showUnderReviewBanner && (
        <Alert className="border-blue-200 bg-brand-blue/10">
          <Clock className="h-4 w-4 text-brand-blue" />
          <AlertTitle className="text-blue-900">Document Under Review</AlertTitle>
          <AlertDescription className="text-blue-800">
            Your submitted Identity Proof is being reviewed by our team.
            You will receive an email notification once the verification is complete.
          </AlertDescription>
        </Alert>
      )}

      {kycStatus === 'VERIFIED' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">
            Identity Proof Verified
          </AlertTitle>
          <AlertDescription className="text-green-800">
            Your KYC verification is complete. You can now purchase investment plans.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {DOCUMENT_TYPE.name}
                  <span className="text-xs font-normal text-destructive">
                    (Required)
                  </span>
                </CardTitle>
                <CardDescription className="text-sm">
                  {DOCUMENT_TYPE.description}
                </CardDescription>
              </div>
              {identityProof && getStatusBadge(identityProof.verificationStatus)}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {identityProof && (
              <div className="rounded-md bg-muted p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{identityProof.fileName}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(identityProof.fileSize)} • Uploaded{' '}
                        {new Date(identityProof.uploadedAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <a
                    href={`/api/documents/${identityProof.id}/download`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-brand-blue hover:text-brand-blue/80 hover:underline transition-colors duration-200"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    View
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                {identityProof.rejectionReason && (
                  <Alert variant="destructive" className="mt-3">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {identityProof.rejectionReason}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {!isUploading && (
              <Button
                variant={identityProof ? 'outline' : 'default'}
                size="sm"
                onClick={() => setIsUploading(true)}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {identityProof ? 'Replace Document' : 'Upload Document'}
              </Button>
            )}

            {isUploading && (
              <div className="space-y-3 rounded-md border border-border p-4">
                <Label htmlFor="file-upload" className="text-sm font-medium">
                  Select File
                </Label>
                <input
                  id="file-upload"
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                  disabled={uploadState.status === 'uploading'}
                  className="block w-full text-sm text-muted-foreground
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-primary file:text-primary-foreground
                    hover:file:bg-primary/90
                    disabled:opacity-50 disabled:cursor-not-allowed"
                />

                {uploadState.file && (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {uploadState.file.name} (
                      {formatFileSize(uploadState.file.size)})
                    </p>

                    <Textarea
                      placeholder="Optional: Add a description"
                      value={uploadState.description}
                      onChange={(e) =>
                        setUploadState((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      disabled={uploadState.status === 'uploading'}
                      className="h-20 text-sm"
                    />
                  </>
                )}

                {uploadState.status === 'uploading' && (
                  <div className="space-y-2">
                    <Progress value={uploadState.progress} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Uploading... {uploadState.progress}%
                    </p>
                  </div>
                )}

                {uploadState.status === 'error' && uploadState.error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      {uploadState.error}
                    </AlertDescription>
                  </Alert>
                )}

                {uploadState.status === 'success' && (
                  <Alert className="border-green-200 bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-sm text-green-800">
                      Document uploaded successfully!
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsUploading(false);
                      setUploadState({
                        file: null,
                        progress: 0,
                        status: 'idle',
                        description: '',
                      });
                    }}
                    disabled={uploadState.status === 'uploading'}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={
                      !uploadState.file || uploadState.status === 'uploading'
                    }
                    className="flex-1"
                  >
                    {uploadState.status === 'uploading' ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      'Upload'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Accepted formats: JPG, PNG, PDF (Max 5MB). Your document will be
          securely stored and used only for verification purposes.
        </AlertDescription>
      </Alert>
    </div>
  );
}
