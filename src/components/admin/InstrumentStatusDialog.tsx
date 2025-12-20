'use client';

/**
 * Instrument Status Toggle Dialog
 * Dialog for activating/deactivating instruments with reason tracking
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'react-hot-toast';

interface InstrumentStatusDialogProps {
  instrumentId: string;
  instrumentName: string;
  currentStatus: boolean; // true = active, false = inactive
  holdingsCount?: number;
  onStatusChanged?: () => void;
  trigger?: React.ReactNode;
}

export function InstrumentStatusDialog({
  instrumentId,
  instrumentName,
  currentStatus,
  holdingsCount = 0,
  onStatusChanged,
  trigger,
}: InstrumentStatusDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const targetStatus = !currentStatus;
  const actionText = targetStatus ? 'activate' : 'deactivate';
  const actionTextCapitalized = actionText.charAt(0).toUpperCase() + actionText.slice(1);

  const handleSubmit = async () => {
    // Validate reason for deactivation
    if (!targetStatus && !reason.trim()) {
      toast.error('Please provide a reason for deactivation');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/admin/instruments/${instrumentId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isActive: targetStatus,
          reason: reason.trim() || undefined,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        toast.error(result.error || `Failed to ${actionText} instrument`);
        return;
      }

      toast.success(`Instrument ${actionText}d successfully`);
      setOpen(false);
      setReason('');

      if (onStatusChanged) {
        onStatusChanged();
      } else {
        router.refresh();
      }
    } catch (error) {
      console.error(`Error ${actionText}ing instrument:`, error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant={currentStatus ? 'outline' : 'default'}>
            {actionTextCapitalized}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{actionTextCapitalized} Instrument</DialogTitle>
          <DialogDescription>
            {targetStatus ? (
              <>
                Are you sure you want to activate <strong>{instrumentName}</strong>? This will make
                it available for client investments.
              </>
            ) : (
              <>
                Are you sure you want to deactivate <strong>{instrumentName}</strong>? This will
                prevent new client investments.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Warning for deactivation with holdings */}
          {!targetStatus && holdingsCount > 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex gap-3">
                <svg
                  className="h-5 w-5 flex-shrink-0 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-destructive">
                    Cannot Deactivate: Active Holdings Exist
                  </p>
                  <p className="mt-1 text-sm text-destructive/80">
                    This instrument has {holdingsCount} active{' '}
                    {holdingsCount === 1 ? 'holding' : 'holdings'}. All holdings must be closed
                    before the instrument can be deactivated.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Reason field (required for deactivation) */}
          {!targetStatus && (
            <div className="space-y-2">
              <Label htmlFor="reason">
                Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this instrument is being deactivated..."
                rows={4}
                disabled={isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                This reason will be logged in the audit trail
              </p>
            </div>
          )}

          {/* Optional reason for activation */}
          {targetStatus && (
            <div className="space-y-2">
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Optionally explain why this instrument is being activated..."
                rows={3}
                disabled={isSubmitting}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || (!targetStatus && holdingsCount > 0) || (!targetStatus && !reason.trim())
            }
            variant={targetStatus ? 'default' : 'destructive'}
          >
            {isSubmitting ? 'Processing...' : actionTextCapitalized}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
