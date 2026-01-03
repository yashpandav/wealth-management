/**
 * Document Upload Page
 * Users can upload KYC documents (Aadhaar, PAN, additional docs)
 */

import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/session';
import { DocumentUploadForm } from './document-upload-form';

export const metadata: Metadata = {
  title: 'Upload Documents | Wealth Management CRM',
  description: 'Upload your KYC documents for verification',
};

export default async function UploadDocumentsPage() {
  const user = await getCurrentUser();

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/login?callbackUrl=/upload-documents');
  }

  // Only clients need to upload documents
  if (user.role !== 'CLIENT') {
    redirect('/dashboard');
  }

  // If already verified, redirect to dashboard
  if (user.verificationStatus === 'VERIFIED') {
    redirect('/client/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-4 md:px-6 lg:px-8">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">
            Upload Your Documents
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Please upload the required documents for KYC verification.
            Your account will be activated once your documents are verified.
          </p>
        </div>

        <DocumentUploadForm
          userEmail={user.email}
          userName={`${user.firstName} ${user.lastName}`}
          verificationStatus={user.verificationStatus}
        />
      </div>
    </div>
  );
}
