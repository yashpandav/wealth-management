'use client';

import { useState, useEffect, useCallback } from 'react';

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileSize: number;
  filePath: string;
  verificationStatus: string;
  uploadedAt: string;
  verifiedAt: string | null;
  rejectionReason: string | null;
  verifiedBy: string | null;
}

interface ClientWithDocuments {
  clientId: string;
  clientName: string;
  clientEmail: string;
  assignedRM: string | null;
  verificationStatus: string;
  documents: Document[];
  allVerified: boolean;
  hasPending: boolean;
  hasRejected: boolean;
}

interface RelationshipManager {
  id: string;
  name: string;
  email: string;
  clientCount: number;
}

interface DocumentVerificationClientProps {
  relationshipManagers: RelationshipManager[];
}

export function DocumentVerificationClient({ relationshipManagers }: DocumentVerificationClientProps) {
  const [clients, setClients] = useState<ClientWithDocuments[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientWithDocuments | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [actionType, setActionType] = useState<'VERIFY' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedRM, setSelectedRM] = useState('');
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/documents/verify?status=${statusFilter}&limit=100`);
      const data = await res.json();
      if (data.success) {
        // Group documents by client
        const clientMap = new Map<string, ClientWithDocuments>();

        data.documents.forEach((doc: {
          id: string;
          documentType: string;
          fileName: string;
          fileSize: number;
          filePath: string;
          verificationStatus: string;
          uploadedAt: string;
          verifiedAt: string | null;
          rejectionReason: string | null;
          verifiedBy: string | null;
          client: {
            id: string;
            name: string;
            email: string;
            assignedRM: string | null;
          };
        }) => {
          const clientId = doc.client.id;
          if (!clientMap.has(clientId)) {
            clientMap.set(clientId, {
              clientId,
              clientName: doc.client.name,
              clientEmail: doc.client.email,
              assignedRM: doc.client.assignedRM,
              verificationStatus: '',
              documents: [],
              allVerified: true,
              hasPending: false,
              hasRejected: false,
            });
          }

          const client = clientMap.get(clientId)!;
          client.documents.push({
            id: doc.id,
            documentType: doc.documentType,
            fileName: doc.fileName,
            fileSize: doc.fileSize,
            filePath: doc.filePath,
            verificationStatus: doc.verificationStatus,
            uploadedAt: doc.uploadedAt,
            verifiedAt: doc.verifiedAt,
            rejectionReason: doc.rejectionReason,
            verifiedBy: doc.verifiedBy,
          });

          if (doc.verificationStatus !== 'VERIFIED') {
            client.allVerified = false;
          }
          if (doc.verificationStatus === 'PENDING' || doc.verificationStatus === 'UNDER_REVIEW') {
            client.hasPending = true;
          }
          if (doc.verificationStatus === 'REJECTED') {
            client.hasRejected = true;
          }
        });

        // Calculate overall status for each client
        clientMap.forEach((client) => {
          if (client.allVerified) {
            client.verificationStatus = 'VERIFIED';
          } else if (client.hasRejected) {
            client.verificationStatus = 'REJECTED';
          } else if (client.hasPending) {
            client.verificationStatus = 'PENDING';
          }
        });

        setClients(Array.from(clientMap.values()));
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const openDocModal = (doc: Document, client: ClientWithDocuments, action: 'VERIFY' | 'REJECT') => {
    setSelectedDocument(doc);
    setSelectedClient(client);
    setActionType(action);
    setRejectionReason('');
    setShowDocModal(true);
  };

  const closeDocModal = () => {
    setShowDocModal(false);
    setSelectedDocument(null);
    setSelectedClient(null);
    setActionType(null);
    setRejectionReason('');
  };

  const openAssignModal = (client: ClientWithDocuments) => {
    setSelectedClient(client);
    setSelectedRM('');
    setShowAssignModal(true);
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setSelectedClient(null);
    setSelectedRM('');
  };

  const handleDocumentAction = async () => {
    if (!selectedDocument || !actionType) return;

    if (actionType === 'REJECT' && !rejectionReason.trim()) {
      setMessage({ type: 'error', text: 'Please provide a rejection reason' });
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/documents/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: selectedDocument.id,
          action: actionType,
          rejectionReason: actionType === 'REJECT' ? rejectionReason : undefined,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Document ${actionType === 'VERIFY' ? 'verified' : 'rejected'} successfully`,
        });
        closeDocModal();
        fetchDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to process document' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setProcessing(false);
    }
  };

  const handleAssignRM = async () => {
    if (!selectedClient || !selectedRM) {
      setMessage({ type: 'error', text: 'Please select a Relationship Manager' });
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/client/assign-rm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.clientId,
          rmId: selectedRM,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Relationship Manager assigned successfully to ${selectedClient.clientName}`,
        });
        closeAssignModal();
        fetchDocuments();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to assign RM' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      UNDER_REVIEW: 'bg-blue-100 text-blue-800',
      VERIFIED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const toggleExpand = (clientId: string) => {
    setExpandedClient(expandedClient === clientId ? null : clientId);
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="float-right font-bold">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border rounded-lg p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
          <div className="flex gap-2">
            {['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ALL'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  statusFilter === status
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Clients List */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
            Loading documents...
          </div>
        ) : clients.length === 0 ? (
          <div className="bg-white border rounded-lg p-8 text-center text-gray-500">
            No clients with documents found
          </div>
        ) : (
          clients.map((client) => (
            <div key={client.clientId} className="bg-white border rounded-lg overflow-hidden">
              {/* Client Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between"
                onClick={() => toggleExpand(client.clientId)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-semibold">
                      {client.clientName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{client.clientName}</h3>
                    <p className="text-sm text-gray-500">{client.clientEmail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(client.verificationStatus)}`}>
                        {client.allVerified ? 'All Verified' : client.hasRejected ? 'Has Rejected' : 'Pending Review'}
                      </span>
                      <span className="text-sm text-gray-500">
                        {client.documents.length} document{client.documents.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {client.assignedRM ? (
                        <span className="text-green-600">RM: {client.assignedRM}</span>
                      ) : client.allVerified ? (
                        <span className="text-yellow-600">RM Not Assigned</span>
                      ) : (
                        <span className="text-gray-400">Verify all docs to assign RM</span>
                      )}
                    </div>
                  </div>

                  {/* Assign RM Button - Only show when all docs verified and no RM assigned */}
                  {client.allVerified && !client.assignedRM && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAssignModal(client);
                      }}
                      className="px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Assign RM
                    </button>
                  )}

                  <svg
                    className={`h-5 w-5 text-gray-400 transition-transform ${
                      expandedClient === client.clientId ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Documents List - Expanded */}
              {expandedClient === client.clientId && (
                <div className="border-t bg-gray-50 p-4">
                  <table className="min-w-full">
                    <thead>
                      <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                        <th className="pb-2">Document Type</th>
                        <th className="pb-2">File</th>
                        <th className="pb-2">Uploaded</th>
                        <th className="pb-2">Status</th>
                        <th className="pb-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {client.documents.map((doc) => (
                        <tr key={doc.id} className="bg-white">
                          <td className="py-3 text-sm font-medium text-gray-900">
                            {doc.documentType}
                          </td>
                          <td className="py-3">
                            <a
                              href={doc.filePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              {doc.fileName}
                            </a>
                            <span className="text-xs text-gray-500 ml-2">
                              ({formatFileSize(doc.fileSize)})
                            </span>
                          </td>
                          <td className="py-3 text-sm text-gray-500">
                            {new Date(doc.uploadedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(doc.verificationStatus)}`}>
                              {doc.verificationStatus}
                            </span>
                            {doc.rejectionReason && (
                              <p className="text-xs text-red-600 mt-1">
                                Reason: {doc.rejectionReason}
                              </p>
                            )}
                            {doc.verifiedBy && (
                              <p className="text-xs text-gray-500 mt-1">
                                By: {doc.verifiedBy}
                              </p>
                            )}
                          </td>
                          <td className="py-3">
                            {(doc.verificationStatus === 'PENDING' || doc.verificationStatus === 'UNDER_REVIEW') ? (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openDocModal(doc, client, 'VERIFY')}
                                  className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                  Verify
                                </button>
                                <button
                                  onClick={() => openDocModal(doc, client, 'REJECT')}
                                  className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">Processed</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Document Verification Modal */}
      {showDocModal && selectedDocument && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  {actionType === 'VERIFY' ? 'Verify Document' : 'Reject Document'}
                </h2>
                <button onClick={closeDocModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ×
                </button>
              </div>

              {/* Document Preview */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium mb-2">Document Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Client:</span>
                    <p className="font-medium">{selectedClient.clientName}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedClient.clientEmail}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Document Type:</span>
                    <p className="font-medium">{selectedDocument.documentType}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">File:</span>
                    <p className="font-medium">{selectedDocument.fileName}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <a
                    href={selectedDocument.filePath}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800"
                  >
                    <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Document
                  </a>
                </div>
              </div>

              {actionType === 'REJECT' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Please provide a reason for rejection..."
                  />
                </div>
              )}

              {actionType === 'VERIFY' && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> You can assign a Relationship Manager after all documents for this client are verified.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeDocModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDocumentAction}
                  disabled={processing}
                  className={`px-4 py-2 text-white rounded-md disabled:opacity-50 ${
                    actionType === 'VERIFY'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processing ? 'Processing...' : actionType === 'VERIFY' ? 'Verify Document' : 'Reject Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign RM Modal */}
      {showAssignModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assign Relationship Manager</h2>
                <button onClick={closeAssignModal} className="text-gray-400 hover:text-gray-600 text-2xl">
                  ×
                </button>
              </div>

              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>All documents verified!</strong> You can now assign a Relationship Manager to {selectedClient.clientName}.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Relationship Manager <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedRM}
                  onChange={(e) => setSelectedRM(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Select RM --</option>
                  {relationshipManagers.map((rm) => (
                    <option key={rm.id} value={rm.id}>
                      {rm.name} ({rm.email}) - {rm.clientCount} clients
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeAssignModal}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignRM}
                  disabled={processing || !selectedRM}
                  className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {processing ? 'Assigning...' : 'Assign RM'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
