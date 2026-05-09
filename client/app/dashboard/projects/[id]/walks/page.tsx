'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, walksApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScheduleWalkForm } from '@/components/ScheduleWalkForm';
import { ArrowLeft, Calendar, Plus, User, Clock } from 'lucide-react';
import Link from 'next/link';

export default function WalksListPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = parseInt(params.id as string);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getById(projectId);
      return response.data.project;
    },
  });

  const { data: walksData, isLoading } = useQuery({
    queryKey: ['walks', projectId],
    queryFn: async () => {
      const response = await walksApi.getAll({ projectId });
      return response.data.walks;
    },
  });

  const walks = walksData || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/30',
      in_progress: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/30',
      completed: 'bg-green-100 text-green-700 ring-1 ring-green-600/30',
      cancelled: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/30',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 mt-0.5"
            onClick={() => router.push(`/dashboard/projects/${projectId}/property`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Property Walks</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {projectData?.projectName} — Walk Schedule & History
            </p>
          </div>
        </div>
        <Button className="w-full sm:w-auto shrink-0" onClick={() => setScheduleModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Schedule Walk
        </Button>
      </div>

      <ScheduleWalkForm
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        projectId={projectId}
        propertyId={projectData?.propertyId || 1}
      />

      {/* Walks List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-4 text-sm text-gray-500">Loading walks...</p>
        </div>
      ) : walks.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No property walks scheduled yet</p>
            <Button onClick={() => setScheduleModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule First Walk
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {walks.map((walk: any) => (
            <Link key={walk.id} href={`/dashboard/projects/${projectId}/walks/${walk.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg capitalize">
                        {walk.walkType.replace('_', ' ')} Walk
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(walk.walkDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColor(walk.walkStatus)}`}>
                      {walk.walkStatus.replace('_', ' ')}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {walk.conductor && (
                      <div className="flex items-center gap-2 text-sm">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Conducted by:</span>
                        <span className="font-medium">
                          {walk.conductor.userFirst} {walk.conductor.userLast}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">
                        {new Date(walk.walkDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {walk.observations && walk.observations.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium">
                          {walk.observations.length} Observation{walk.observations.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                    {walk.notes && (
                      <p className="text-sm text-muted-foreground line-clamp-2 pt-2">
                        {walk.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
