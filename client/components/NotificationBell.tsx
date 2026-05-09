'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Bell, CheckCheck, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function NotificationBell() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: notificationsData } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsApi.getAll();
      return res.data;
    },
    refetchInterval: 30000,
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.markAsRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearMutation = useMutation({
    mutationFn: (id: number) => notificationsApi.clear(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const clearAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.clearAllRead(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Only show notifications that haven't been cleared
  const allNotifications = (notificationsData?.notifications || []).filter(
    (n: any) => !n.isCleared
  );
  const unreadCount = allNotifications.filter((n: any) => !n.isRead).length;
  const hasRead = allNotifications.some((n: any) => n.isRead);

  const handleNotificationClick = (notification: any) => {
    if (!notification.isRead) markAsReadMutation.mutate(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
      setOpen(false);
    }
  };

  const handleClear = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    clearMutation.mutate(id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const diffMs = Date.now() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='relative text-white hover:bg-white/10 hover:text-white'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <span className='absolute top-1 right-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center'>
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-80'>
        {/* Header */}
        <div className='flex items-center justify-between px-3 py-2'>
          <h3 className='font-semibold text-sm'>Notifications</h3>
          <div className='flex items-center gap-1'>
            {unreadCount > 0 && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs'
                onClick={() => markAllAsReadMutation.mutate()}
                disabled={markAllAsReadMutation.isPending}
              >
                <CheckCheck className='h-3.5 w-3.5 mr-1' />
                Mark all read
              </Button>
            )}
            {hasRead && (
              <Button
                variant='ghost'
                size='sm'
                className='h-7 text-xs text-muted-foreground'
                onClick={() => clearAllReadMutation.mutate()}
                disabled={clearAllReadMutation.isPending}
              >
                Clear read
              </Button>
            )}
          </div>
        </div>

        <DropdownMenuSeparator />

        {/* Notification list */}
        <div className='max-h-[400px] overflow-y-auto'>
          {allNotifications.length === 0 ? (
            <div className='p-6 text-center text-muted-foreground text-sm'>
              <Bell className='h-8 w-8 mx-auto mb-2 text-gray-300' />
              All clear
            </div>
          ) : (
            allNotifications.slice(0, 10).map((notification: any) => (
              <DropdownMenuItem
                key={notification.id}
                className={`p-3 cursor-pointer focus:bg-gray-50 group ${!notification.isRead ? 'bg-blue-50 focus:bg-blue-50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-2'>
                    <p className='font-medium text-sm leading-snug'>{notification.title}</p>
                    <div className='flex items-center gap-1 shrink-0'>
                      {!notification.isRead && (
                        <div className='h-2 w-2 rounded-full bg-blue-500' />
                      )}
                      <button
                        onClick={(e) => handleClear(e, notification.id)}
                        className='opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-gray-200'
                      >
                        <X className='h-3 w-3 text-gray-400' />
                      </button>
                    </div>
                  </div>
                  <p className='text-xs text-muted-foreground line-clamp-2 mt-0.5'>
                    {notification.message}
                  </p>
                  <p className='text-xs text-muted-foreground mt-1'>
                    {formatTime(notification.createdAt)}
                  </p>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {allNotifications.length > 10 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className='text-center text-sm text-muted-foreground justify-center py-2'
              onClick={() => { router.push('/dashboard/notifications'); setOpen(false); }}
            >
              View all notifications
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
