/**
 * DocAdmin Dashboard Page
 * Overview of document verification and product requests
 */

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Welcome back, {session.user.firstName}. Manage document verification and product requests.
        </p>
      </div>

      {/* Document Verification Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Document Verification</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/docadmin/documents?status=PENDING" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-amber-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending Review</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{docStats.pending}</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg">
                  <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/docadmin/documents?status=UNDER_REVIEW" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-brand-blue transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Under Review</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{docStats.underReview}</p>
                </div>
                <div className="p-3 bg-brand-blue/10 rounded-lg">
                  <svg className="h-6 w-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Verified</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{docStats.verified}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Rejected</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{docStats.rejected}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Request Stats */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Product Requests</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/docadmin/product-requests" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-purple-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Product Requested</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{productStats.productRequested}</p>
                  <p className="text-xs text-gray-500 mt-1">Awaiting RM approval</p>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/docadmin/contract-pending" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-indigo-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Contract Pending</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{productStats.contractPending}</p>
                  <p className="text-xs text-gray-500 mt-1">Ready for contract upload</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <svg className="h-6 w-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>

          <Link href="/docadmin/contract-created" className="block">
            <div className="bg-white border border-gray-200 rounded-lg p-5 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Completed</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{productStats.completed}</p>
                  <p className="text-xs text-gray-500 mt-1">Finalized purchases</p>
                </div>
                <div className="p-3 bg-emerald-50 rounded-lg">
                  <svg className="h-6 w-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Two Column Layout for Recent Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Documents */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Documents</h2>
            <Link href="/docadmin/documents" className="text-sm text-brand-blue hover:text-brand-blue/80 font-medium">
              View All
            </Link>
          </div>

          {recentDocuments.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 text-sm mt-2">No documents pending review</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentDocuments.map((doc) => (
                <Link
                  key={doc.id}
                  href={`/docadmin/documents?documentId=${doc.id}`}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-brand-blue hover:bg-brand-blue/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {doc.client.user.firstName} {doc.client.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{doc.documentType}</p>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        doc.verificationStatus === 'PENDING'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {doc.verificationStatus}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent Product Requests */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Product Requests</h2>
            <Link href="/docadmin/product-requests" className="text-sm text-brand-blue hover:text-brand-blue/80 font-medium">
              View All
            </Link>
          </div>

          {recentProductRequests.length === 0 ? (
            <div className="text-center py-8">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-gray-500 text-sm mt-2">No pending product requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentProductRequests.map((req) => (
                <Link
                  key={req.id}
                  href={req.status === 'PENDING' ? '/docadmin/product-requests' : '/docadmin/contract-pending'}
                  className="block border border-gray-200 rounded-lg p-4 hover:border-brand-blue hover:bg-brand-blue/5 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {req.client.user.firstName} {req.client.user.lastName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{req.product.name}</p>
                      <p className="text-xs text-gray-600 mt-1 font-medium">
                        {req.product.currency} {Number(req.amount).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                        req.status === 'PENDING'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {req.status === 'PENDING' ? 'Requested' : 'Contract Pending'}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(req.createdAt).toLocaleDateString()}
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
