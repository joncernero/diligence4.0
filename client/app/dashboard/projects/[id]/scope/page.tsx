'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, scopeApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScopeForm } from '@/components/ScopeForm';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  ListChecks,
  AlertCircle,
} from 'lucide-react';

export default function ProjectScopePage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  const [addScopeOpen, setAddScopeOpen] = useState(false);
  const [editScope, setEditScope] = useState<any>(null);

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await projectsApi.getById(projectId);
      return res.data.project;
    },
  });

  const { data: scopeData, isLoading } = useQuery({
    queryKey: ['scope', projectId],
    queryFn: async () => {
      const res = await scopeApi.getAll(projectId);
      return res.data.scopeItems;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => scopeApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scope'] });
    },
  });

  const scopeItems = scopeData || [];

  const totalEstimated = scopeItems.reduce(
    (sum: number, item: any) => sum + (parseFloat(item.estimatedCost) || 0),
    0,
  );
  const totalActual = scopeItems.reduce(
    (sum: number, item: any) => sum + (parseFloat(item.actualCost) || 0),
    0,
  );
  const variance = totalEstimated - totalActual;

  const groupedByDivision = scopeItems.reduce((acc: any, item: any) => {
    const division = item.csiCode?.divisionTitle || 'Uncategorized';
    if (!acc[division]) acc[division] = [];
    acc[division].push(item);
    return acc;
  }, {});

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planned: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/30',
      in_progress: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/30',
      completed: 'bg-green-100 text-green-700 ring-1 ring-green-600/30',
      on_hold: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/30',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete scope item "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className='p-4 md:p-8 space-y-4 md:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='icon'
            className='shrink-0'
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Project Scope</h1>
            <p className='text-muted-foreground text-sm mt-0.5'>
              {projectData?.projectName}
            </p>
          </div>
        </div>
        <Button onClick={() => setAddScopeOpen(true)} className='w-full sm:w-auto'>
          <Plus className='h-4 w-4 mr-2' />
          Add Scope Item
        </Button>
      </div>

      {/* Forms */}
      <ScopeForm
        open={addScopeOpen}
        onOpenChange={setAddScopeOpen}
        projectId={projectId}
        propertyId={projectData?.propertyId}
      />
      {editScope && (
        <ScopeForm
          open={!!editScope}
          onOpenChange={(open) => !open && setEditScope(null)}
          projectId={projectId}
          propertyId={projectData?.propertyId}
          existingScope={editScope}
        />
      )}

      {/* Budget Summary — compact 3-col always */}
      {scopeItems.length > 0 && (
        <div className='grid grid-cols-3 gap-2 md:gap-4'>
          <Card>
            <CardContent className='p-3 md:p-5'>
              <div className='flex items-start gap-2 md:gap-3'>
                <div className='p-2 bg-blue-100 rounded-lg shrink-0'>
                  <DollarSign className='h-4 w-4 md:h-5 md:w-5 text-blue-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground leading-tight'>Estimated</p>
                  <p className='font-bold text-sm md:text-lg mt-0.5 truncate'>
                    ${totalEstimated.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-3 md:p-5'>
              <div className='flex items-start gap-2 md:gap-3'>
                <div className='p-2 bg-green-100 rounded-lg shrink-0'>
                  <DollarSign className='h-4 w-4 md:h-5 md:w-5 text-green-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground leading-tight'>Actual</p>
                  <p className='font-bold text-sm md:text-lg mt-0.5 truncate'>
                    ${totalActual.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className='p-3 md:p-5'>
              <div className='flex items-start gap-2 md:gap-3'>
                <div className='p-2 bg-purple-100 rounded-lg shrink-0'>
                  <ListChecks className='h-4 w-4 md:h-5 md:w-5 text-purple-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground leading-tight'>Items</p>
                  <p className='font-bold text-sm md:text-lg mt-0.5'>{scopeItems.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Scope Items */}
      {isLoading ? (
        <div className='flex items-center justify-center min-h-[300px]'>
          <div className='text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
            <p className='mt-4 text-sm text-gray-500'>Loading scope items...</p>
          </div>
        </div>
      ) : scopeItems.length === 0 ? (
        <Card>
          <CardContent className='py-14 text-center'>
            <ListChecks className='h-14 w-14 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-700 mb-2'>No Scope Items Yet</h3>
            <p className='text-muted-foreground mb-6 text-sm max-w-xs mx-auto'>
              Define the work to be done, link to CSI codes, and track budgets.
            </p>
            <Button onClick={() => setAddScopeOpen(true)}>
              <Plus className='h-4 w-4 mr-2' />
              Add First Scope Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-6'>
          {Object.entries(groupedByDivision).map(
            ([division, items]: [string, any]) => (
              <div key={division}>
                {/* Division heading */}
                <div className='flex items-center gap-2 mb-3'>
                  <div className='h-4 w-1 rounded-full bg-[#081448]' />
                  <h2 className='text-sm font-bold uppercase tracking-wide text-gray-600'>
                    {division}
                  </h2>
                  <span className='text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full'>
                    {items.length}
                  </span>
                </div>

                <div className='space-y-2'>
                  {items.map((item: any) => (
                    <Card
                      key={item.id}
                      className='hover:shadow-md transition-shadow'>
                      <CardContent className='p-4 md:p-5'>
                        {/* Top row: name + status + actions */}
                        <div className='flex items-start justify-between gap-2 mb-2'>
                          <div className='flex-1 min-w-0'>
                            <h3 className='font-semibold text-base leading-snug'>
                              {item.scopeName}
                            </h3>
                            {item.description && (
                              <p className='text-sm text-muted-foreground mt-0.5 line-clamp-2'>
                                {item.description}
                              </p>
                            )}
                          </div>
                          <div className='flex items-center gap-1.5 shrink-0'>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${getStatusColor(item.status)}`}>
                              {item.status.replace('_', ' ')}
                            </span>
                            <Button
                              size='sm'
                              variant='outline'
                              className='h-7 w-7 p-0'
                              onClick={() => setEditScope(item)}>
                              <Edit className='h-3 w-3' />
                            </Button>
                            <Button
                              size='sm'
                              variant='outline'
                              className='h-7 w-7 p-0'
                              onClick={() => handleDelete(item.id, item.scopeName)}>
                              <Trash2 className='h-3 w-3 text-destructive' />
                            </Button>
                          </div>
                        </div>

                        {/* Cost + CSI row — wraps on mobile */}
                        <div className='flex flex-wrap items-center gap-x-4 gap-y-1 text-sm'>
                          {item.csiCode && (
                            <span className='text-muted-foreground'>
                              CSI:{' '}
                              <span className='font-medium text-gray-700'>
                                {item.csiCode.code}
                              </span>
                            </span>
                          )}
                          {item.estimatedCost && (
                            <span className='text-muted-foreground'>
                              Est:{' '}
                              <span className='font-semibold text-primary'>
                                ${parseFloat(item.estimatedCost).toLocaleString()}
                              </span>
                            </span>
                          )}
                          {item.actualCost && (
                            <span className='text-muted-foreground'>
                              Actual:{' '}
                              <span className='font-semibold text-gray-800'>
                                ${parseFloat(item.actualCost).toLocaleString()}
                              </span>
                            </span>
                          )}
                        </div>

                        {/* Linked observations */}
                        {item.observationLinks?.length > 0 && (
                          <div className='mt-2 pt-2 border-t'>
                            <p className='text-xs text-muted-foreground flex items-center gap-1'>
                              <AlertCircle className='h-3.5 w-3.5 shrink-0' />
                              {item.observationLinks.length} linked observation
                              {item.observationLinks.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
}
