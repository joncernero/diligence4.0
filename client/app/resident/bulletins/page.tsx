'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bulletinsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, CheckCheck, CalendarDays } from 'lucide-react';

const categoryColors: Record<string, string> = {
  general:        'bg-gray-100 text-gray-700',
  work_notice:    'bg-blue-100 text-blue-700',
  utility_shutoff:'bg-orange-100 text-orange-700',
  access_notice:  'bg-yellow-100 text-yellow-700',
  completion:     'bg-green-100 text-green-700',
};

const categoryLabels: Record<string, string> = {
  general:         'General',
  work_notice:     'Work Notice',
  utility_shutoff: 'Utility Shutoff',
  access_notice:   'Access Notice',
  completion:      'Completion',
};

export default function ResidentBulletinsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['bulletins'],
    queryFn: async () => (await bulletinsApi.getAll()).data.bulletins,
  });

  const markReadMutation = useMutation({
    mutationFn: (id: number) => bulletinsApi.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bulletins'] }),
  });

  const bulletins = data || [];

  return (
    <div className='p-4 space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-xl font-bold text-gray-900'>Bulletins</h1>
        <p className='text-sm text-muted-foreground'>
          {bulletins.filter((b: any) => !b.isRead).length} unread
        </p>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-12'>
          <div className='h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
        </div>
      ) : bulletins.length === 0 ? (
        <Card>
          <CardContent className='py-16 text-center'>
            <Bell className='h-14 w-14 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500'>No bulletins yet</p>
            <p className='text-xs text-muted-foreground mt-1'>Your property manager will post updates here</p>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-3'>
          {bulletins.map((b: any) => (
            <Card
              key={b.id}
              className={`transition-shadow ${!b.isRead ? 'border-blue-200 bg-blue-50/40' : ''}`}
              onClick={() => { if (!b.isRead) markReadMutation.mutate(b.id); }}
            >
              <CardContent className='p-4'>
                <div className='flex items-start justify-between gap-3 mb-2'>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 flex-wrap mb-1'>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColors[b.category] || categoryColors.general}`}>
                        {categoryLabels[b.category] || 'General'}
                      </span>
                      {!b.isRead && (
                        <span className='text-xs text-blue-600 font-semibold'>New</span>
                      )}
                    </div>
                    <h3 className={`font-semibold text-sm ${!b.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                      {b.title}
                    </h3>
                  </div>
                  {b.isRead && <CheckCheck className='h-4 w-4 text-gray-300 shrink-0 mt-0.5' />}
                </div>
                <p className='text-sm text-gray-600 leading-relaxed'>{b.body}</p>
                <div className='flex items-center gap-3 mt-3 flex-wrap'>
                  <p className='text-xs text-muted-foreground'>
                    Posted {new Date(b.createdAt).toLocaleDateString(undefined, {
                      weekday: 'short', month: 'short', day: 'numeric',
                    })}
                  </p>
                  {b.scheduledDate && (
                    <span className='flex items-center gap-1 text-xs font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full'>
                      <CalendarDays className='h-3 w-3' />
                      {new Date(b.scheduledDate).toLocaleDateString(undefined, {
                        weekday: 'short', month: 'short', day: 'numeric',
                        ...(new Date(b.scheduledDate).getHours() !== 0 && {
                          hour: '2-digit', minute: '2-digit',
                        }),
                      })}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
