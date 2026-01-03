'use client';

/**
 * Instrument Audit Log Component
 * Displays audit trail and version history for instrument changes
 */

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { AuditAction } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';

interface AuditLog {
  id: string;
  action: AuditAction;
  description: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}

interface InstrumentAuditLogProps {
  instrumentId: string;
}

export function InstrumentAuditLog({ instrumentId }: InstrumentAuditLogProps) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionFilter, setActionFilter] = useState<string>('all');

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(actionFilter !== 'all' && { action: actionFilter }),
      });

      const response = await fetch(`/api/admin/instruments/${instrumentId}/audit-logs?${params}`);
      const result = await response.json();

      if (result.success) {
        setLogs(result.data.logs);
        setTotalPages(result.data.pagination.totalPages);
      } else {
        toast.error(result.error || 'Failed to load audit logs');
      }
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, [instrumentId, page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [instrumentId, page, actionFilter, fetchLogs]);

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case AuditAction.INSTRUMENT_CREATE:
        return <Badge className="bg-green-600">Created</Badge>;
      case AuditAction.INSTRUMENT_UPDATE:
        return <Badge className="bg-brand-blue">Updated</Badge>;
      case AuditAction.INSTRUMENT_DELETE:
        return <Badge variant="destructive">Deleted</Badge>;
      case AuditAction.INSTRUMENT_ACTIVATE:
        return <Badge className="bg-green-600">Activated</Badge>;
      case AuditAction.INSTRUMENT_DEACTIVATE:
        return <Badge className="bg-orange-600">Deactivated</Badge>;
      default:
        return <Badge>{action.replace('INSTRUMENT_', '')}</Badge>;
    }
  };

  const renderChangeDetails = (log: AuditLog) => {
    if (log.action === AuditAction.INSTRUMENT_UPDATE && log.metadata?.changes) {
      const changes = log.metadata.changes;
      return (
        <div className="mt-2 space-y-1 rounded-md bg-muted/50 p-3 text-sm">
          <p className="font-medium text-muted-foreground">Changes:</p>
          {Object.entries(changes).map(([field, change]: [string, { old: unknown; new: unknown }]) => (
            <div key={field} className="flex items-start gap-2">
              <span className="font-medium capitalize">{field.replace(/([A-Z])/g, ' $1')}:</span>
              <span className="text-muted-foreground">
                <span className="line-through">{String(change.old || 'null')}</span>
                {' → '}
                <span className="font-medium text-foreground">{String(change.new || 'null')}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }

    if (log.metadata?.reason) {
      return (
        <div className="mt-2 rounded-md bg-muted/50 p-3 text-sm">
          <p className="font-medium text-muted-foreground">Reason:</p>
          <p className="mt-1">{String(log.metadata.reason)}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle>Audit Trail</CardTitle>
            <CardDescription>Complete history of all changes to this instrument</CardDescription>
          </div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value={AuditAction.INSTRUMENT_CREATE}>Created</SelectItem>
              <SelectItem value={AuditAction.INSTRUMENT_UPDATE}>Updated</SelectItem>
              <SelectItem value={AuditAction.INSTRUMENT_ACTIVATE}>Activated</SelectItem>
              <SelectItem value={AuditAction.INSTRUMENT_DEACTIVATE}>Deactivated</SelectItem>
              <SelectItem value={AuditAction.INSTRUMENT_DELETE}>Deleted</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-4 md:py-6 lg:py-8 text-center text-muted-foreground">Loading audit logs...</div>
        ) : logs.length === 0 ? (
          <div className="py-4 md:py-6 lg:py-8 text-center text-muted-foreground">No audit logs found</div>
        ) : (
          <>
            {/* Timeline */}
            <div className="space-y-4">
              {logs.map((log, index) => (
                <div key={log.id} className="relative flex flex-col sm:flex-row gap-4">
                  {/* Timeline connector */}
                  {index < logs.length - 1 && (
                    <div className="absolute left-4 top-10 h-full w-px bg-border" />
                  )}

                  {/* Timeline dot */}
                  <div className="relative flex h-8 w-8 flex-shrink-0 items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-primary ring-4 ring-background" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1 pb-8">
                    <div className="flex items-center gap-2">
                      {getActionBadge(log.action)}
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.createdAt), 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>

                    <p className="font-medium">{log.description}</p>

                    <p className="text-sm text-muted-foreground">
                      by {log.user.firstName} {log.user.lastName}
                      {' • '}
                      <span className="capitalize">{log.user.role.toLowerCase()}</span>
                    </p>

                    {renderChangeDetails(log)}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
