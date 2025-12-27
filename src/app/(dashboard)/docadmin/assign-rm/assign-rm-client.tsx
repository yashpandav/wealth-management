'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Users,
  UserCheck,
  Clock,
  CheckCircle2,
  Phone,
  Mail,
  Calendar,
  FileCheck,
  UserPlus,
  X,
  Loader2,
  AlertCircle,
  ChevronRight,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Client {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  documentsCount: number;
  registeredAt: string;
  verifiedAt: string | null;
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

/**
 * Renders the Assign RM dashboard for viewing clients pending assignment and assigning a Relationship Manager to a client.
 *
 * Displays summary stats, a table of verified clients awaiting assignment, an RM workload overview, and a dialog to select and assign an RM to a client.
 *
 * @param clients - Array of clients eligible for RM assignment; each client includes identification, contact, document count, registration date, and optional verification timestamp.
 * @param relationshipManagers - Array of relationship managers with their current client counts used for selection and workload display.
 * @returns The rendered React element for the Assign RM Client dashboard.
 */
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
      const res = await fetch(`/api/docadmin/clients/${selectedClient.id}/assign-rm`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rmId: selectedRM }),
      });

      const data = await res.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Successfully assigned RM to ${selectedClient.name}`,
        });
        closeModal();
        router.refresh();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to assign RM' });
      }
    } catch {
      setMessage({ type: 'error', text: 'An error occurred while assigning RM' });
    } finally {
      setProcessing(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const avgClientsPerRM =
    relationshipManagers.length > 0
      ? Math.round(
          relationshipManagers.reduce((sum, rm) => sum + rm.clientCount, 0) /
            relationshipManagers.length
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Alert Messages */}
      {message && (
        <div
          className={`flex items-center gap-3 rounded-lg border p-4 ${
            message.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <p className="text-sm font-medium">{message.text}</p>
          <button
            onClick={() => setMessage(null)}
            className="ml-auto rounded-md p-1 hover:bg-black/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Assignment
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{clients.length}</div>
            <p className="text-xs text-muted-foreground">
              Clients awaiting RM
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Available RMs
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{relationshipManagers.length}</div>
            <p className="text-xs text-muted-foreground">
              Active relationship managers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg Clients per RM
            </CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgClientsPerRM}</div>
            <p className="text-xs text-muted-foreground">
              Current workload distribution
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Clients Pending RM Assignment</CardTitle>
          <CardDescription>
            These clients have completed KYC verification and are ready to be assigned to a Relationship Manager
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">All Caught Up!</h3>
              <p className="mt-1 text-sm text-muted-foreground max-w-sm">
                No clients with verified KYC are pending RM assignment. Check back later for new clients.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Registered</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                            {getInitials(client.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{client.name}</div>
                          <div className="text-sm text-muted-foreground">{client.email}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Phone className="h-3.5 w-3.5" />
                          {client.phone}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <Badge variant="default" className="w-fit bg-green-600 hover:bg-green-600">
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Verified
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {client.documentsCount} document{client.documentsCount !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatDate(client.registeredAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.verifiedAt ? (
                        <div className="flex items-center gap-1.5 text-sm">
                          <FileCheck className="h-3.5 w-3.5 text-green-600" />
                          {formatDate(client.verifiedAt)}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => openModal(client)}>
                        <UserPlus className="mr-1.5 h-4 w-4" />
                        Assign RM
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* RM Workload Overview */}
      {relationshipManagers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>RM Workload Overview</CardTitle>
            <CardDescription>
              Current client distribution across Relationship Managers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {relationshipManagers.map((rm) => (
                <div
                  key={rm.id}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        {getInitials(rm.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{rm.name}</div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        {rm.email}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">{rm.clientCount}</div>
                    <div className="text-xs text-muted-foreground">clients</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assign RM Dialog */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Relationship Manager</DialogTitle>
            <DialogDescription>
              Select a Relationship Manager to assign to this client
            </DialogDescription>
          </DialogHeader>

          {selectedClient && (
            <div className="space-y-4">
              {/* Client Info */}
              <div className="rounded-lg border bg-muted/50 p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                      {getInitials(selectedClient.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <h4 className="font-semibold">{selectedClient.name}</h4>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedClient.email}
                    </div>
                    {selectedClient.phone && (
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5" />
                        {selectedClient.phone}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3 border-t pt-3">
                  <div>
                    <div className="text-xs text-muted-foreground">KYC Status</div>
                    <Badge variant="default" className="mt-1 bg-green-600 hover:bg-green-600">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Verified
                    </Badge>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Documents</div>
                    <div className="mt-1 text-sm font-medium">
                      {selectedClient.documentsCount} verified
                    </div>
                  </div>
                </div>
              </div>

              {/* RM Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Select Relationship Manager <span className="text-destructive">*</span>
                </label>
                <Select value={selectedRM} onValueChange={setSelectedRM}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a Relationship Manager..." />
                  </SelectTrigger>
                  <SelectContent>
                    {relationshipManagers.map((rm) => (
                      <SelectItem key={rm.id} value={rm.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{rm.name}</span>
                          <span className="text-muted-foreground">
                            ({rm.clientCount} clients)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Selected RM Preview */}
              {selectedRM && (
                <div className="rounded-lg border p-3">
                  {(() => {
                    const rm = relationshipManagers.find((r) => r.id === selectedRM);
                    if (!rm) return null;
                    return (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-secondary">
                              {getInitials(rm.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{rm.name}</div>
                            <div className="text-xs text-muted-foreground">{rm.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {rm.clientCount} clients
                          <ChevronRight className="h-4 w-4" />
                          {rm.clientCount + 1}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeModal} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleAssignRM} disabled={processing || !selectedRM}>
              {processing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Assign RM
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}