/**
 * Notification Dropdown Component
 * Displays list of notifications with actions
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckCheck,
  AlertCircle,
  Info,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { NotificationType } from '@/types';

interface Notification {
  id: string;
  type: NotificationType;
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: Date | null;
  actionUrl: string | null;
  actionText: string | null;
  createdAt: Date;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  unreadCount: number;
  onMarkAsRead: () => void;
  onViewAll?: () => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'SUCCESS':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    case 'ERROR':
      return <XCircle className="h-5 w-5 text-red-500" />;
    case 'WARNING':
      return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    case 'ALERT':
      return <AlertCircle className="h-5 w-5 text-orange-500" />;
    case 'INFO':
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

async function markAsRead(notificationIds: string[]) {
  const response = await fetch('/api/user/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationIds }),
  });
  return response.json();
}

async function markAllAsRead() {
  const response = await fetch('/api/user/notifications', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ markAllAsRead: true }),
  });
  return response.json();
}

export function NotificationDropdown({
  notifications,
  unreadCount,
  onMarkAsRead,
  onViewAll
}: NotificationDropdownProps) {
  const [marking, setMarking] = useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    setMarking(true);
    try {
      await markAsRead([notificationId]);
      onMarkAsRead();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    } finally {
      setMarking(false);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarking(true);
    try {
      await markAllAsRead();
      onMarkAsRead();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    } finally {
      setMarking(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div>
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={marking}
            className="h-8 text-xs hover:bg-brand-blue hover:text-white transition-colors duration-200"
          >
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      <Separator />

      {/* Notifications List */}
      <ScrollArea className="h-[60vh] sm:h-[400px]">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Bell className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={cn(
                  'relative p-4 transition-colors duration-200 hover:bg-brand-blue/5 group',
                  !notification.isRead && 'bg-brand-blue/5'
                )}
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-3 pr-6">
                      <p className={cn("text-sm leading-snug", !notification.isRead ? "font-semibold text-gray-900" : "font-medium text-gray-700")}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            handleMarkAsRead(notification.id);
                          }}
                          disabled={marking}
                          title="Mark as read"
                          className="absolute right-3 top-3 text-brand-blue opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-brand-blue/10 rounded-full"
                        >
                          <span className="sr-only">Mark read</span>
                          <CheckCheck className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-y-1 pt-1">
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {formatDistanceToNow(new Date(notification.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                      {notification.actionUrl && (
                        <Link
                          href={notification.actionUrl as any} // eslint-disable-line @typescript-eslint/no-explicit-any
                          onClick={() => {
                            if (onViewAll) onViewAll();
                          }}
                          className="text-xs font-medium text-brand-blue hover:text-brand-blue/80 hover:underline inline-flex items-center gap-1 transition-colors ml-auto"
                        >
                          {notification.actionText || 'View Details'}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
                {!notification.isRead && (
                  <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-brand-blue group-hover:opacity-0 transition-opacity" />
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <Separator />

      {/* Footer */}
      <div className="p-3 bg-gray-50/50">
        <Link
          href="/notifications"
          className="block"
          onClick={() => {
            if (onViewAll) onViewAll();
          }}
        >
          <Button variant="ghost" size="sm" className="w-full hover:bg-brand-blue hover:text-white transition-colors duration-200 h-9 font-medium">
            View all notifications
          </Button>
        </Link>
      </div>
    </div>
  );
}

function Bell(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
