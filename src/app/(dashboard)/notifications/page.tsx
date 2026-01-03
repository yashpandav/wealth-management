/**
 * Notifications Page
 * View and manage notifications for all authenticated users
 */

'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Check, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Notification {
  id: string;
  type: string;
  category: string;
  title: string;
  message: string;
  isRead: boolean;
  readAt: string | null;
  actionUrl: string | null;
  actionText: string | null;
  createdAt: string;
}

export default function NotificationsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated') {
      fetchNotifications();
    }
  }, [status, router]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/notifications?limit=50');
      const data = await response.json();

      if (data.success) {
        setNotifications(data.data.notifications);
      } else {
        toast.error('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${id}/read`, {
        method: 'PATCH',
      });

      if (response.ok) {
        setNotifications(notifications.map(n =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`/api/user/notifications/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNotifications(notifications.filter(n => n.id !== id));
        toast.success('Notification deleted');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Failed to delete notification');
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-4 md:py-6 lg:py-8">
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return (
    <div className="container mx-auto py-4 md:py-6 lg:py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="mt-2 text-muted-foreground">
            Stay updated with your latest activities and updates
          </p>
        </div>
        <Button onClick={fetchNotifications} variant="outline" size="sm" className="hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors duration-200">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-lg font-medium">No notifications</p>
              <p className="mt-2 text-muted-foreground">
                You&apos;re all caught up! Check back later for new updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card key={notification.id} className={notification.isRead ? 'bg-background' : 'bg-brand-blue/10'}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-lg">{notification.title}</CardTitle>
                      {!notification.isRead && (
                        <Badge variant="default" className="text-xs">New</Badge>
                      )}
                      <Badge variant="outline" className="text-xs">{notification.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Button
                        onClick={() => markAsRead(notification.id)}
                        variant="ghost"
                        size="sm"
                        title="Mark as read"
                        className="hover:bg-brand-blue hover:text-white transition-colors duration-200"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteNotification(notification.id)}
                      variant="ghost"
                      size="sm"
                      title="Delete"
                      className="hover:bg-destructive hover:text-white transition-colors duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{notification.message}</p>
                {notification.actionUrl && notification.actionText && (
                  <Button
                    onClick={() => {
                      // Type assertion needed due to Next.js router type limitations
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      router.push(notification.actionUrl as any);
                    }}
                    variant="outline"
                    size="sm"
                    className="hover:bg-brand-blue hover:text-white hover:border-brand-blue transition-colors duration-200"
                  >
                    {notification.actionText}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
