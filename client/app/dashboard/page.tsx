'use client';

import { useQuery } from '@tanstack/react-query';
import { projectsApi, observationsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderKanban, Clock, AlertCircle, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response.data.projects;
    },
  });

  const { data: observationsData } = useQuery({
    queryKey: ['observations-all'],
    queryFn: async () => {
      const response = await observationsApi.getAll();
      return response.data.observations;
    },
  });

  const projects = projectsData || [];
  const observations = observationsData || [];

  const activeProjects = projects.filter(
    (p: any) => p.projectStatus === 'active',
  );
  const openObservations = observations.filter((o: any) => o.status === 'open');
  const criticalObservations = observations.filter(
    (o: any) => o.severity === 'critical',
  );

  const stats = [
    {
      title: 'Total Projects',
      value: projects.length,
      icon: FolderKanban,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/dashboard/projects',
    },
    {
      title: 'Active',
      value: activeProjects.length,
      icon: Clock,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      href: '/dashboard/projects',
    },
    {
      title: 'Open Issues',
      value: openObservations.length,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      href: '/dashboard/projects',
    },
    {
      title: 'Critical',
      value: criticalObservations.length,
      icon: AlertCircle,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      href: '/dashboard/projects',
    },
  ];

  const getStatusStyle = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700 ring-1 ring-green-600/30',
      proposal: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/30',
      lead: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/30',
      on_hold: 'bg-orange-100 text-orange-700 ring-1 ring-orange-600/30',
      completed: 'bg-purple-100 text-purple-700 ring-1 ring-purple-600/30',
      archived: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/30',
    };
    return map[status] || 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/30';
  };

  return (
    <div className='p-4 md:p-8 space-y-4 md:space-y-6'>
      {/* Header */}
      <div className='mb-2 md:mb-4'>
        <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Dashboard</h1>
        <p className='text-gray-500 text-sm mt-1'>
          Here's an overview of your projects.
        </p>
      </div>

      {/* Stat Cards — 2×2 on mobile, 1×4 on desktop */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4'>
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className='hover:shadow-md active:scale-[0.98] transition-all cursor-pointer h-full'>
              <CardContent className='p-4 md:p-5'>
                <div className='flex items-start justify-between gap-2'>
                  <div className='min-w-0'>
                    <p className='text-xs font-medium text-gray-500 leading-tight'>
                      {stat.title}
                    </p>
                    <p className='text-3xl font-bold mt-1.5 leading-none'>
                      {isLoading ? (
                        <span className='text-gray-300'>—</span>
                      ) : (
                        stat.value
                      )}
                    </p>
                  </div>
                  <div className={`p-2 rounded-lg shrink-0 ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Projects */}
      <Card>
        <CardHeader className='flex flex-row items-center justify-between pb-3'>
          <CardTitle className='text-base md:text-lg'>Recent Projects</CardTitle>
          <Link
            href='/dashboard/projects'
            className='text-sm text-blue-600 hover:underline flex items-center gap-1'>
            View all
            <ChevronRight className='h-3.5 w-3.5' />
          </Link>
        </CardHeader>
        <CardContent className='p-0'>
          {isLoading ? (
            <div className='px-6 pb-6'>
              <p className='text-gray-500 text-sm'>Loading projects...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className='px-6 pb-6 text-center'>
              <p className='text-gray-500 text-sm'>
                No projects yet.{' '}
                <Link
                  href='/dashboard/projects'
                  className='text-blue-600 hover:underline'>
                  Create your first project
                </Link>
              </p>
            </div>
          ) : (
            <div className='divide-y'>
              {projects.slice(0, 5).map((project: any) => (
                <Link
                  key={project.id}
                  href={`/dashboard/projects/${project.id}`}>
                  <div className='flex items-center justify-between px-4 md:px-6 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer'>
                    <div className='min-w-0 flex-1'>
                      <h3 className='font-medium text-gray-900 text-sm truncate'>
                        {project.projectName}
                      </h3>
                      <p className='text-xs text-gray-500 mt-0.5 truncate'>
                        {project.projectNumber}
                        {project.projectType
                          ? ` · ${project.projectType.replace('_', ' ')}`
                          : ''}
                      </p>
                    </div>
                    <div className='flex items-center gap-2 shrink-0 ml-3'>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold capitalize whitespace-nowrap ${getStatusStyle(project.projectStatus)}`}>
                        {project.projectStatus?.replace('_', ' ')}
                      </span>
                      <ChevronRight className='h-4 w-4 text-gray-400' />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
