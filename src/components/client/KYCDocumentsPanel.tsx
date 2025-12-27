/**
 * KYC Documents Panel Component
 * Displays client's KYC documents with status and upload functionality
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
import { VerificationStatus } from '@prisma/client';
import { formatFileSize } from '@/lib/utils';

// Document types for upload
const DOCUMENT_TYPES = [
  {
    id: 'IDENTITY_PROOF',
    name: 'Identity Proof',
    description: 'Aadhaar/Passport/Driving License',
    required: true,
  },
  {
    id: 'ADDRESS_PROOF',
    name: 'Address Proof',
    description: 'Utility Bill/Bank Statement (less than 3 months old)',
    required: true,
  },
  {
    id: 'INCOME_PROOF',
    name: 'Income Proof',
    description: 'Salary Slip/Tax Return',
    required: false,
  },
  {
    id: 'BANK_STATEMENT',
    name: 'Bank Statement',
    description: 'Last 3 months',
    required: false,
  },
] as const;

type DocumentType = (typeof DOCUMENT_TYPES)[number]['id'];

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  description: string | null;
  verificationStatus: string;
  uploadedAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
}

interface DocumentsResponse {
  success: boolean;
  data: {
    documents: Document[];
    verificationStatus: VerificationStatus;
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
  documentType: string,
  description: string
): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
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
  const [uploadingType, setUploadingType] = useState<DocumentType | null>(null);
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    progress: 0,
    status: 'idle',
    description: '',
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['documents'],
    queryFn: fetchDocuments,
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const uploadMutation = useMutation({
    mutationFn: ({
      file,
      documentType,
      description,
    }: {
      file: File;
      documentType: string;
      description: string;
    }) => uploadDocument(file, documentType, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setUploadState({
        file: null,
        progress: 0,
        status: 'success',
        description: '',
      });
      setTimeout(() => {
        setUploadingType(null);
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
    if (!uploadState.file || !uploadingType) return;

    setUploadState((prev) => ({ ...prev, status: 'uploading', progress: 10 }));

    // Simulate progress
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
        documentType: uploadingType,
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
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
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

  const getDocumentByType = (type: string) => {
    return data?.data.documents.find((doc) => doc.documentType === type);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading documents...</span>
      </div>
    );
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

  const documents = data?.data.documents || [];
  const verificationStatus = data?.data.verificationStatus;

  // Show banner if documents are under review
  const showUnderReviewBanner = verificationStatus === 'PENDING' || verificationStatus === 'UNDER_REVIEW';

  // Upload interface - show document types with upload buttons
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">KYC Documents</h2>
        <p className="text-muted-foreground mt-1">
          Upload and manage your verification documents
        </p>
      </div>

      {showUnderReviewBanner && (
        <Alert className="border-blue-200 bg-blue-50">
          <Clock className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-900">Documents Under Review</AlertTitle>
          <AlertDescription className="text-blue-800">
            Your submitted documents are being reviewed by our team.
            You can continue uploading any remaining documents.
            You will receive an email notification once the verification is complete.
          </AlertDescription>
        </Alert>
      )}

      {!showUnderReviewBanner && documents.length > 0 && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">
            {documents.filter((d) => d.verificationStatus === 'VERIFIED').length} of{' '}
            {documents.length} documents verified
          </AlertTitle>
          <AlertDescription className="text-green-800">
            Continue uploading remaining documents to complete your verification.
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        {DOCUMENT_TYPES.map((docType) => {
          const existingDoc = getDocumentByType(docType.id);
          const isUploading = uploadingType === docType.id;

          return (
            <Card key={docType.id} className="border-border">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {docType.name}
                      {docType.required && (
                        <span className="text-xs font-normal text-destructive">
                          (Required)
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {docType.description}
                    </CardDescription>
                  </div>
                  {existingDoc && getStatusBadge(existingDoc.verificationStatus)}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {existingDoc && (
                  <div className="rounded-md bg-muted p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{existingDoc.fileName}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(existingDoc.fileSize)} • Uploaded{' '}
                            {new Date(existingDoc.uploadedAt).toLocaleDateString('en-IN')}
                          </p>
                        </div>
                      </div>
                      <a
                        href={existingDoc.filePath}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    {existingDoc.rejectionReason && (
                      <Alert variant="destructive" className="mt-3">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          {existingDoc.rejectionReason}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                {!isUploading && (
                  <Button
                    variant={existingDoc ? 'outline' : 'default'}
                    size="sm"
                    onClick={() => setUploadingType(docType.id as DocumentType)}
                    className="w-full"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {existingDoc ? 'Replace Document' : 'Upload Document'}
                  </Button>
                )}

                {isUploading && (
                  <div className="space-y-3 rounded-md border border-border p-4">
                    <Label htmlFor={`file-${docType.id}`} className="text-sm font-medium">
                      Select File
                    </Label>
                    <input
                      id={`file-${docType.id}`}
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
                          setUploadingType(null);
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
          );
        })}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Accepted formats: JPG, PNG, PDF (Max 5MB each). Your documents will be
          securely stored and used only for verification purposes.
        </AlertDescription>
      </Alert>
    </div>
  );
}
