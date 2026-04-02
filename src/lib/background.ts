/**
 * Fire-and-forget background task runner.
 * Use for non-critical side-effects (notifications, audit logs, emails)
 * that should NOT block the HTTP response.
 *
 * Usage:
 *   runInBackground(
 *     prisma.notification.create({ data: ... }),
 *     prisma.auditLog.create({ data: ... }),
 *     sendEmail({ to: ..., subject: ..., html: ... }),
 *   );
 */
export function runInBackground(...tasks: Promise<unknown>[]): void {
  Promise.allSettled(tasks).catch(() => {});
}
