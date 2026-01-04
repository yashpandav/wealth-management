/**
 * DocAdmin Dashboard Page
 * Overview of document verification and product requests
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { StatCard } from '@/components/dashboard/StatCard';
import {
  Clock,
  Search,
  CheckCircle,
  XCircle,
  FileText,
  FileSignature,
  FileCheck
} from 'lucide-react';

export const metadata = {
  title: 'DocAdmin Dashboard | Wealth Management CRM',
  description: 'Document verification and product request management dashboard',
};

async function getDocumentStats() {
  const [pending, underReview, verified, rejected] = await Promise.all([
    prisma.document.count({ where: { verificationStatus: 'PENDING' } }),
    prisma.document.count({ where: { verificationStatus: 'UNDER_REVIEW' } }),
    prisma.document.count({ where: { verificationStatus: 'VERIFIED' } }),
    prisma.document.count({ where: { verificationStatus: 'REJECTED' } }),
  ]);

  return { pending, underReview, verified, rejected };
}

async function getProductRequestStats() {
  const [productRequested, contractPending, completed] = await Promise.all([
    prisma.productPurchaseRequest.count({ where: { status: 'PENDING' } }),
    prisma.productPurchaseRequest.count({ where: { status: 'APPROVED' } }),
    prisma.productPurchaseRequest.count({ where: { status: 'COMPLETED' } }),
  ]);

  return { productRequested, contractPending, completed };
}

async function getRecentDocuments() {
  return prisma.document.findMany({
    where: {
      verificationStatus: { in: ['PENDING', 'UNDER_REVIEW'] },
    },
    include: {
      client: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: { uploadedAt: 'desc' },
    take: 5,
  });
}

async function getRecentProductRequests() {
  return prisma.productPurchaseRequest.findMany({
    where: {
      status: { in: ['PENDING', 'APPROVED'] },
    },
    include: {
      client: {
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      product: {
        select: {
          name: true,
          currency: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });
}

export default async function DocAdminDashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'DOCADMIN') {
    redirect('/login');
  }

  const [docStats, productStats, recentDocuments, recentProductRequests] = await Promise.all([
    getDocumentStats(),
    getProductRequestStats(),
    getRecentDocuments(),
    getRecentProductRequests(),
  ]);

  return (
    <div className="container px-4 md:px-6 lg:px-8 py-4 md:py-6 lg:py-8">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-optima text-2xl font-bold text-brand-blue">Dashboard</h1>
        <p className="font-georgia text-brand-grey mt-1 text-sm">
          Welcome back, {session.user.firstName}
        </p>
      </div>

      {/* Document Verification Stats */}
      <div className="mb-8">
        <h2 className="font-optima text-sm font-semibold text-brand-blue mb-3">Document Verification</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Pending"
            value={docStats.pending}
            icon={Clock}
            status="warning"
            href="/docadmin/documents?status=PENDING"
          />

          <StatCard
            title="Under Review"
            value={docStats.underReview}
            icon={Search}
            status="info"
            href="/docadmin/documents?status=UNDER_REVIEW"
          />

          <StatCard
            title="Verified"
            value={docStats.verified}
            icon={CheckCircle}
            status="success"
          // No link for Verified general view
          />

          <StatCard
            title="Rejected"
            value={docStats.rejected}
            icon={XCircle}
            status="danger"
          // No link for Rejected general view
          />
        </div>
      </div>

      {/* Product Request Stats */}
      <div className="mb-8">
        <h2 className="font-optima text-sm font-semibold text-brand-blue mb-3">Product Requests</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <StatCard
            title="Pending Requests"
            value={productStats.productRequested}
            icon={FileText}
            status="info"
            href="/docadmin/product-requests"
          />

          <StatCard
            title="Contract Pending"
            value={productStats.contractPending}
            icon={FileSignature}
            status="info" // Indigo -> Info/Brand
            href="/docadmin/contract-pending"
          />

          <StatCard
            title="Completed"
            value={productStats.completed}
            icon={FileCheck}
            status="success"
            href="/docadmin/contract-created"
          />
        </div>
      </div>

      {/* Two Column Layout for Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Recent Documents */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-optima text-sm font-semibold text-brand-blue">Recent Documents</h2>
            <Link href="/docadmin/documents" className="text-xs text-brand-blue hover:text-brand-blue/80 font-medium">
              View All
            </Link>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="text-center py-4">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-xs mt-2">No documents pending review</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/docadmin/documents?documentId=${doc.id}`}
                  className="block border border-gray-100 rounded-lg p-2.5 hover:border-brand-blue hover:bg-brand-blue/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-optima text-xs font-medium text-brand-blue truncate">
                        {doc.client.user.firstName} {doc.client.user.lastName}
                      </p>
                      <p className="font-georgia text-[10px] text-brand-grey mt-0.5">{doc.documentType}</p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${doc.verificationStatus === 'PENDING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-blue-100 text-blue-800'
                        }`}>
                        {doc.verificationStatus}
                      </span>
                      <p className="font-georgia text-[10px] text-brand-grey mt-0.5">
                        {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Product Requests */}
        <div className="bg-white border border-gray-200 rounded-lg p-3">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-optima text-sm font-semibold text-brand-blue">Recent Product Requests</h2>
            <Link href="/docadmin/product-requests" className="text-xs text-brand-blue hover:text-brand-blue/80 font-medium">
              View All
            </Link>
          </div>

          {recentProductRequests.length === 0 ? (
            <div className="text-center py-4">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-xs mt-2">No pending product requests</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentProductRequests.map((req) => (
                <Link
                  key={req.id}
                  href={req.status === 'PENDING' ? '/docadmin/product-requests' : '/docadmin/contract-pending'}
                  className="block border border-gray-100 rounded-lg p-2.5 hover:border-brand-blue hover:bg-brand-blue/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-optima text-xs font-medium text-brand-blue truncate">
                        {req.client.user.firstName} {req.client.user.lastName}
                      </p>
                      <p className="font-georgia text-[10px] text-brand-grey mt-0.5 truncate">{req.product.name}</p>
                      <p className="text-[10px] text-gray-600 mt-0.5 font-medium">
                        {req.product.currency} {(Number(req.amount) / 1000).toFixed(1)}K
                      </p>
                    </div>
                    <div className="text-right ml-3 flex-shrink-0">
                      <span className={`inline-block px-1.5 py-0.5 text-[10px] font-medium rounded ${req.status === 'PENDING'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-indigo-100 text-indigo-800'
                        }`}>
                        {req.status === 'PENDING' ? 'Requested' : 'Contract'}
                      </span>
                      <p className="font-georgia text-[10px] text-brand-grey mt-0.5">
                        {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
