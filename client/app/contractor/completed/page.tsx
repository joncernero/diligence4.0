'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { observationsApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ChevronRight, MapPin } from 'lucide-react';

export default function ContractorCompletedPage() {
  const router = useRouter();

  const { data: resolvedData, isLoading: loadingResolved } = useQuery({
    queryKey: ['assigned-observations', 'resolved'],
    queryFn: async () => (await observationsApi.getAssigned({ status: 'resolved' })).data.observations,
  });

  const { data: verifiedData } = useQuery({
    queryKey: ['assigned-observations', 'verified'],
    queryFn: async () => (await observationsApi.getAssigned({ status: 'verified' })).data.observations,
  });

  const { data: closedData } = useQuery({
    queryKey: ['assigned-observations', 'closed'],
    queryFn: async () => (await observationsApi.getAssigned({ status: 'closed' })).data.observations,
  });

  const observations = [
    ...(resolvedData || []),
    ...(verifiedData || []),
    ...(closedData || []),
  ].sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  const STATUS_LABELS: Record<string, { label: string; className: string }> = {
    resolved: { label: 'Resolved', className: 'bg-green-100 text-green-700' },
    verified: { label: 'Verified ✓', className: 'bg-purple-100 text-purple-700' },
    closed: { label: 'Closed', className: 'bg-gray-100 text-gray-600' },
  };

  return (
    <div className='p-4 space-y-4'>
      <div>
        <h1 className='text-xl font-bold text-gray-900'>Completed Work</h1>
        <p className='text-sm text-muted-foreground mt-0.5'>Resolved, verified, and closed items</p>
      </div>

      {loadingResolved && (
        <div className='space-y-3'>
          {[1, 2, 3].map(i => (
            <div key={i} className='h-24 bg-gray-100 rounded-xl animate-pulse' />
          ))}
        </div>
      )}

      {!loadingResolved && observations.length === 0 && (
        <Card>
          <CardContent className='py-16 text-center'>
            <CheckCircle className='h-12 w-12 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500 font-medium'>No completed work yet</p>
            <p className='text-xs text-muted-foreground mt-1'>Resolved items will appear here</p>
          </CardContent>
        </Card>
      )}

      {!loadingResolved && observations.length > 0 && (
        <div className='space-y-3'>
          {observations.map((obs: any) => {
            const statusInfo = STATUS_LABELS[obs.status] || { label: obs.status, className: 'bg-gray-100 text-gray-600' };
            return (
              <Card
                key={obs.id}
                className='cursor-pointer hover:shadow-md transition-shadow opacity-90'
                onClick={() => router.push(`/contractor/${obs.id}`)}
              >
                <CardContent className='p-4'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center gap-2 mb-1'>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className='font-semibold text-gray-900 truncate'>{obs.title}</p>
                      <div className='flex gap-3 mt-1 text-xs text-muted-foreground'>
                        {obs.project && <span>{obs.project.projectName}</span>}
                        {obs.location && (
                          <span className='flex items-center gap-0.5'>
                            <MapPin className='h-3 w-3' /> {obs.location}
                          </span>
                        )}
                      </div>
                      <p className='text-xs text-muted-foreground mt-1'>
                        Updated {new Date(obs.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <ChevronRight className='h-5 w-5 text-gray-400 shrink-0 mt-1' />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
