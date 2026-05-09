'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { observationsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, AlertCircle, Clock, MapPin, ChevronRight } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  verified: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-100 text-gray-600',
  wont_fix: 'bg-gray-100 text-gray-500',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-600 font-semibold',
  major: 'text-orange-600',
  minor: 'text-yellow-600',
  cosmetic: 'text-blue-600',
};

const PRIORITY_LABELS: Record<string, string> = {
  urgent: '🔴 Urgent',
  high: '🟠 High',
  medium: '🟡 Medium',
  low: '🟢 Low',
};

export default function ContractorHomePage() {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState('open');

  const { data, isLoading } = useQuery({
    queryKey: ['assigned-observations', statusFilter],
    queryFn: async () => {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      return (await observationsApi.getAssigned(params)).data.observations;
    },
  });

  const observations = data || [];

  const filterTabs = [
    { label: 'Open', value: 'open' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'All Active', value: 'all' },
  ];

  return (
    <div className='p-4 space-y-4'>
      <div>
        <h1 className='text-xl font-bold text-gray-900'>My Assignments</h1>
        <p className='text-sm text-muted-foreground mt-0.5'>Observations assigned to you</p>
      </div>

      {/* Filter tabs */}
      <div className='flex gap-2'>
        {filterTabs.map(tab => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === tab.value
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {isLoading && (
        <div className='space-y-3'>
          {[1, 2, 3].map(i => (
            <div key={i} className='h-28 bg-gray-100 rounded-xl animate-pulse' />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && observations.length === 0 && (
        <Card>
          <CardContent className='py-16 text-center'>
            <ClipboardList className='h-12 w-12 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500 font-medium'>No observations assigned</p>
            <p className='text-xs text-muted-foreground mt-1'>
              {statusFilter === 'open' ? 'Nothing open right now — great work!' : 'Nothing to show for this filter.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Observation cards */}
      {!isLoading && observations.length > 0 && (
        <div className='space-y-3'>
          {observations.map((obs: any) => (
            <Card
              key={obs.id}
              className='cursor-pointer hover:shadow-md transition-shadow border border-gray-200'
              onClick={() => router.push(`/contractor/${obs.id}`)}
            >
              <CardContent className='p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div className='flex-1 min-w-0'>
                    {/* Title + status */}
                    <div className='flex items-center gap-2 flex-wrap mb-1'>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[obs.status] || 'bg-gray-100 text-gray-600'}`}>
                        {obs.status?.replace(/_/g, ' ')}
                      </span>
                      {obs.severity && (
                        <span className={`text-xs ${SEVERITY_COLORS[obs.severity] || 'text-gray-500'}`}>
                          {obs.severity}
                        </span>
                      )}
                    </div>

                    <p className='font-semibold text-gray-900 truncate'>{obs.title}</p>
                    <p className='text-sm text-muted-foreground line-clamp-2 mt-0.5'>{obs.description}</p>

                    {/* Meta row */}
                    <div className='flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground'>
                      {obs.project && (
                        <span className='font-medium text-gray-600'>{obs.project.projectName}</span>
                      )}
                      {obs.location && (
                        <span className='flex items-center gap-0.5'>
                          <MapPin className='h-3 w-3' /> {obs.location}
                        </span>
                      )}
                      {obs.dueDate && (
                        <span className='flex items-center gap-0.5'>
                          <Clock className='h-3 w-3' />
                          Due {new Date(obs.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {obs.priority && (
                        <span>{PRIORITY_LABELS[obs.priority] || obs.priority}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className='h-5 w-5 text-gray-400 shrink-0 mt-1' />
                </div>

                {/* Photo count + trade */}
                {(obs.photos?.length > 0 || obs.tradeType) && (
                  <div className='flex gap-2 mt-3 pt-3 border-t border-gray-100'>
                    {obs.tradeType && (
                      <Badge variant='secondary' className='text-xs capitalize'>
                        {obs.tradeType}
                      </Badge>
                    )}
                    {obs.photos?.length > 0 && (
                      <Badge variant='outline' className='text-xs'>
                        {obs.photos.length} photo{obs.photos.length !== 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
