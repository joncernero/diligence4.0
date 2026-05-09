'use client';

import { useQuery } from '@tanstack/react-query';
import { bulletinsApi, residentsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Bell, Calendar, Home, MapPin, Wrench, Building2 } from 'lucide-react';
import Link from 'next/link';

export default function ResidentHomePage() {
  const { data: unitData } = useQuery({
    queryKey: ['residentMe'],
    queryFn: async () => (await residentsApi.getMe()).data.unit,
  });

  const { data: bulletinsData } = useQuery({
    queryKey: ['bulletins'],
    queryFn: async () => (await bulletinsApi.getAll()).data.bulletins,
  });

  const bulletins = bulletinsData || [];
  const unread = bulletins.filter((b: any) => !b.isRead).length;

  return (
    <div className='p-4 space-y-4'>
      {/* Property info */}
      {unitData && (
        <Card>
          <CardContent className='p-4 flex items-center gap-3'>
            <div className='p-2 bg-blue-100 rounded-lg shrink-0'>
              <MapPin className='h-5 w-5 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-muted-foreground'>Your unit</p>
              <p className='font-semibold'>
                {unitData.unitNumber ? `Unit ${unitData.unitNumber}` : 'All units'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick nav cards */}
      <div className='grid grid-cols-2 gap-3'>
        <Link href='/resident/bulletins'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardContent className='p-5 flex flex-col items-center text-center gap-2'>
              <div className='relative'>
                <div className='p-3 bg-blue-100 rounded-xl'>
                  <Bell className='h-6 w-6 text-blue-600' />
                </div>
                {unread > 0 && (
                  <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center'>
                    {unread}
                  </span>
                )}
              </div>
              <div>
                <p className='font-semibold text-sm'>Bulletins</p>
                <p className='text-xs text-muted-foreground'>
                  {unread > 0 ? `${unread} unread` : 'All caught up'}
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/resident/calendar'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardContent className='p-5 flex flex-col items-center text-center gap-2'>
              <div className='p-3 bg-green-100 rounded-xl'>
                <Calendar className='h-6 w-6 text-green-600' />
              </div>
              <div>
                <p className='font-semibold text-sm'>Schedule</p>
                <p className='text-xs text-muted-foreground'>Work calendar</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/resident/unit'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardContent className='p-5 flex flex-col items-center text-center gap-2'>
              <div className='p-3 bg-indigo-100 rounded-xl'>
                <Building2 className='h-6 w-6 text-indigo-600' />
              </div>
              <div>
                <p className='font-semibold text-sm'>My Unit</p>
                <p className='text-xs text-muted-foreground'>Specs & finishes</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/resident/maintenance'>
          <Card className='hover:shadow-md transition-shadow cursor-pointer'>
            <CardContent className='p-5 flex flex-col items-center text-center gap-2'>
              <div className='p-3 bg-orange-100 rounded-xl'>
                <Wrench className='h-6 w-6 text-orange-600' />
              </div>
              <div>
                <p className='font-semibold text-sm'>Maintenance</p>
                <p className='text-xs text-muted-foreground'>Submit a request</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent bulletins preview */}
      {bulletins.length > 0 && (
        <div>
          <h2 className='font-semibold text-gray-700 mb-2 text-sm uppercase tracking-wide'>Recent Bulletins</h2>
          <div className='space-y-2'>
            {bulletins.slice(0, 3).map((b: any) => (
              <Link key={b.id} href='/resident/bulletins'>
                <Card className={`cursor-pointer transition-shadow hover:shadow-md ${!b.isRead ? 'border-blue-200 bg-blue-50/40' : ''}`}>
                  <CardContent className='p-4'>
                    <div className='flex items-start justify-between gap-2'>
                      <div className='flex-1 min-w-0'>
                        <p className={`text-sm font-medium truncate ${!b.isRead ? 'text-blue-900' : 'text-gray-900'}`}>
                          {b.title}
                        </p>
                        <p className='text-xs text-muted-foreground mt-0.5 line-clamp-1'>{b.body}</p>
                      </div>
                      {!b.isRead && (
                        <div className='w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1.5' />
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground mt-1.5'>
                      {new Date(b.createdAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {bulletins.length === 0 && (
        <Card>
          <CardContent className='py-12 text-center'>
            <Bell className='h-12 w-12 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500 text-sm'>No bulletins yet</p>
            <p className='text-xs text-muted-foreground mt-1'>Your property manager will post updates here</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
