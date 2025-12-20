'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  documentsCount: number;
  registeredAt: string;
}

interface RelationshipManager {
  id: string;
  name: string;
  email: string;
  clientCount: number;
}

interface AssignRMClientProps {
  clients: Client[];
  relationshipManagers: RelationshipManager[];
}

export function AssignRMClient({ clients, relationshipManagers }: AssignRMClientProps) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedRM, setSelectedRM] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const openModal = (client: Client) => {
    setSelectedClient(client);
    setSelectedRM('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedClient(null);
    setSelectedRM('');
  };

  const handleAssignRM = async () => {
    if (!selectedClient || !selectedRM) {
      setMessage({ type: 'error', text: 'Please select a Relationship Manager' });
      return;
    }

    setProcessing(true);
    try {
      const res = await fetch('/api/clients/assign-rm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClient.id,
          rmId: selectedRM,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `RM assigned successfully to ${selectedClient.name}`,
        });
        closeModal();
        // Refresh the page to update the list
        router.refresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to assign RM' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setProcessing(false);
    }
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
          <button onClick={() => setMessage(null)} className="float-right font-bold">
            x
          </button>
        </div>
      )}

      {/* Summary Card */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-gray-500">Clients Awaiting RM</div>
          <div className="mt-2 text-2xl font-bold text-blue-600">{clients.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-gray-500">Available RMs</div>
          <div className="mt-2 text-2xl font-bold text-green-600">{relationshipManagers.length}</div>
        </div>
        <div className="bg-white rounded-lg border p-4">
          <div className="text-sm font-medium text-gray-500">Avg Clients per RM</div>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            {relationshipManagers.length > 0
              ? Math.round(
                  relationshipManagers.reduce((sum, rm) => sum + rm.clientCount, 0) /
                    relationshipManagers.length
                )
              : 0}
          </div>
        </div>
      </div>

      {/* Clients List */}
      {clients.length === 0 ? (
        <div className="bg-white border rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
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
          <h3 className="text-lg font-medium text-gray-900">All Caught Up!</h3>
          <p className="text-gray-500 mt-2">
            No verified clients are waiting for RM assignment.
          </p>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Documents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Registered
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-blue-600 font-semibold">
                              {client.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{client.phone || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        {client.documentsCount} verified
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(client.registeredAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openModal(client)}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Assign RM
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RM Workload Overview */}
      {relationshipManagers.length > 0 && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">RM Workload Overview</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {relationshipManagers.map((rm) => (
              <div key={rm.id} className="border rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{rm.name}</div>
                    <div className="text-sm text-gray-500">{rm.email}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">{rm.clientCount}</div>
                    <div className="text-xs text-gray-500">clients</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Assign RM Modal */}
      {showModal && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-xl font-bold text-gray-900">Assign Relationship Manager</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  x
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Client Details</p>
                <p className="text-sm text-blue-700">{selectedClient.name}</p>
                <p className="text-xs text-blue-600">{selectedClient.email}</p>
                <p className="text-xs text-green-600 mt-1">
                  {selectedClient.documentsCount} documents verified
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

              {selectedRM && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  {(() => {
                    const rm = relationshipManagers.find((r) => r.id === selectedRM);
                    if (!rm) return null;
                    return (
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">{rm.name}</p>
                        <p className="text-gray-600">{rm.email}</p>
                        <p className="text-gray-500 mt-1">
                          Currently managing {rm.clientCount} client
                          {rm.clientCount !== 1 ? 's' : ''}
                        </p>
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  onClick={closeModal}
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
