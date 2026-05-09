'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  Calendar,
  DollarSign,
  User,
  Edit,
  Briefcase,
  ListChecks,
  FileText,
  Plus,
  Home,
} from 'lucide-react';
import Link from 'next/link';
import { PropertyForm } from '@/components/PropertyForm';
import { EditProjectModal } from '@/components/EditProjectModal';

export default function ProjectDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [propertyFormOpen, setPropertyFormOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);

  const { data: projectData, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getById(parseInt(projectId));
      return response.data.project;
    },
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='text-center'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
          <p className='mt-4 text-sm text-gray-500'>Loading project...</p>
        </div>
      </div>
    );
  }

  if (!projectData) {
    return (
      <div className='text-center py-12'>
        <p className='text-gray-500'>Project not found</p>
        <Button
          onClick={() => router.push('/dashboard/projects')}
          className='mt-4'>
          Back to Projects
        </Button>
      </div>
    );
  }

  const project = projectData;

  // Status badge color
  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700 ring-1 ring-green-600/30',
      proposal: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/30',
      lead: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/30',
      on_hold: 'bg-orange-100 text-orange-700 ring-1 ring-orange-600/30',
      completed: 'bg-purple-100 text-purple-700 ring-1 ring-purple-600/30',
      archived: 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/30',
    };
    return (
      colors[status] || 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/30'
    );
  };

  return (
    <div className='p-4 md:p-8 space-y-4 md:space-y-6'>
      {/* Property Form */}
      <EditProjectModal
        open={editProjectOpen}
        onOpenChange={setEditProjectOpen}
        project={project}
      />
      <PropertyForm
        open={propertyFormOpen}
        onOpenChange={setPropertyFormOpen}
        existingProperty={project?.property}
        onSuccess={(newProperty) => {
          if (!project.propertyId) {
            // TODO: link new property to project
          }
        }}
      />
      {/* Header */}
      <Card>
        <CardContent className='p-4 md:p-6'>
          {/* Title + badge row — never competes with button */}
          <div className='flex flex-wrap items-center gap-2 mb-1'>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900 break-words'>
              {project.projectName}
            </h1>
            <span
              className={`px-3 py-1 rounded-full text-sm font-semibold capitalize whitespace-nowrap ${
                project.status === 'active'
                  ? 'bg-green-100 text-green-700 ring-1 ring-green-600/30'
                  : project.status === 'planning'
                    ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/30'
                    : project.status === 'on_hold'
                      ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/30'
                      : project.status === 'completed'
                        ? 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/30'
                        : 'bg-red-100 text-red-700 ring-1 ring-red-600/30'
              }`}>
              {project.status?.replace('_', ' ')}
            </span>
          </div>
          <p className='text-muted-foreground text-sm mb-4'>{project.projectNumber}</p>
          {/* Button sits cleanly below the title at all screen sizes */}
          <Button
            onClick={() => setEditProjectOpen(true)}
            className='w-full sm:w-auto'>
            <Edit className='h-4 w-4 mr-2' />
            Edit Project
          </Button>
        </CardContent>
      </Card>

      {/* Key Info Cards */}
      <div className='grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6'>
        {/* Project Manager */}
        <Card>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-start gap-3'>
              <div className='p-2 bg-blue-100 rounded-lg shrink-0'>
                <User className='h-5 w-5 text-blue-600' />
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-gray-500 leading-tight'>PM</p>
                <p className='font-medium text-sm mt-0.5 truncate'>
                  {project.projectManager
                    ? `${project.projectManager.userFirst} ${project.projectManager.userLast}`
                    : 'Not assigned'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Start Date */}
        <Card>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-start gap-3'>
              <div className='p-2 bg-green-100 rounded-lg shrink-0'>
                <Calendar className='h-5 w-5 text-green-600' />
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-gray-500 leading-tight'>Start Date</p>
                <p className='font-medium text-sm mt-0.5'>
                  {project.startDate
                    ? new Date(project.startDate).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Completion Date */}
        <Card>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-start gap-3'>
              <div className='p-2 bg-purple-100 rounded-lg shrink-0'>
                <Calendar className='h-5 w-5 text-purple-600' />
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-gray-500 leading-tight'>Est. Complete</p>
                <p className='font-medium text-sm mt-0.5'>
                  {project.estimatedCompletion
                    ? new Date(project.estimatedCompletion).toLocaleDateString()
                    : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Budget */}
        <Card>
          <CardContent className='p-4 md:p-6'>
            <div className='flex items-start gap-3'>
              <div className='p-2 bg-yellow-100 rounded-lg shrink-0'>
                <DollarSign className='h-5 w-5 text-yellow-600' />
              </div>
              <div className='min-w-0'>
                <p className='text-xs text-gray-500 leading-tight'>Total Budget</p>
                <p className='font-medium text-sm mt-0.5'>
                  {project.totalBudget
                    ? `$${parseFloat(project.totalBudget).toLocaleString()}`
                    : 'Not set'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Nav Tiles — visible immediately on mobile */}
      <div className='grid grid-cols-4 gap-2'>
        {[
          { label: 'Property', icon: Home, href: `/dashboard/projects/${projectId}/property`, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Scope', icon: ListChecks, href: `/dashboard/projects/${projectId}/scope`, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Walks', icon: Calendar, href: `/dashboard/projects/${projectId}/walks`, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Documents', icon: FileText, href: `/dashboard/projects/${projectId}/documents`, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, icon: Icon, href, color, bg }) => (
          <Link key={label} href={href}>
            <div className='flex flex-col items-center gap-1.5 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-300 active:scale-95 transition-all shadow-sm'>
              <div className={`p-2 rounded-lg ${bg}`}>
                <Icon className={`h-5 w-5 ${color}`} />
              </div>
              <span className='text-xs font-medium text-gray-700 text-center leading-tight'>{label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6'>
        {/* Left Column - Project Details */}
        <div className='lg:col-span-2 space-y-6'>
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-sm text-gray-500'>Project Type</p>
                  <p className='font-medium mt-1'>
                    {project.projectType?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Department</p>
                  <p className='font-medium mt-1'>
                    {project.projectDepartment?.replace('_', ' ') || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Status</p>
                  <p className='font-medium mt-1 capitalize'>
                    {project.projectStatus?.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Created</p>
                  <p className='font-medium mt-1'>
                    {new Date(project.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Organizations */}
              {(project.gcOrg || project.clientOrg) && (
                <div className='pt-4 border-t'>
                  <h4 className='font-medium mb-3'>Organizations</h4>
                  <div className='space-y-2'>
                    {project.gcOrg && (
                      <div className='flex items-center gap-2'>
                        <Briefcase className='h-4 w-4 text-gray-400' />
                        <span className='text-sm text-gray-600'>GC:</span>
                        <span className='text-sm font-medium'>
                          {project.gcOrg.orgName}
                        </span>
                      </div>
                    )}
                    {project.clientOrg && (
                      <div className='flex items-center gap-2'>
                        <Building2 className='h-4 w-4 text-gray-400' />
                        <span className='text-sm text-gray-600'>Client:</span>
                        <span className='text-sm font-medium'>
                          {project.clientOrg.orgName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Property Link */}
          <Card>
            <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
              <CardTitle>Property & Units</CardTitle>
              {project.property ? (
                <Button
                  size='sm'
                  className='w-full sm:w-auto'
                  onClick={() => setPropertyFormOpen(true)}>
                  <Edit className='h-4 w-4 mr-2' />
                  Edit Property
                </Button>
              ) : (
                <Button size='sm' className='w-full sm:w-auto' onClick={() => setPropertyFormOpen(true)}>
                  <Plus className='h-4 w-4 mr-2' />
                  Add Property
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {project.property ? (
                <div className='space-y-3'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-muted-foreground'>
                      Property Name
                    </span>
                    <span className='font-medium'>
                      {project.property.propName}
                    </span>
                  </div>
                  {project.property.propAddress && (
                    <div className='flex items-center justify-between'>
                      <span className='text-sm text-muted-foreground'>
                        Address
                      </span>
                      <span className='font-medium text-sm'>
                        {project.property.propAddress}
                      </span>
                    </div>
                  )}
                  <div className='pt-3 border-t'>
                    <Link href={`/dashboard/projects/${project.id}/property`}>
                      <Button variant='outline' size='sm' className='w-full'>
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className='text-center py-4'>
                  <p className='text-sm text-muted-foreground mb-3'>
                    No property assigned
                  </p>
                  <Button size='sm' onClick={() => setPropertyFormOpen(true)}>
                    <Plus className='h-4 w-4 mr-2' />
                    Add Property
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Quick Stats */}
        <div className='space-y-6'>
          {/* Budget Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Budget Overview</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm text-gray-500'>Budgeted</span>
                  <span className='font-medium'>
                    $
                    {project.totalBudget
                      ? parseFloat(project.totalBudget).toLocaleString()
                      : '0'}
                  </span>
                </div>
                <div className='flex justify-between items-center mb-2'>
                  <span className='text-sm text-gray-500'>Actual</span>
                  <span className='font-medium'>
                    $
                    {project.totalActual
                      ? parseFloat(project.totalActual).toLocaleString()
                      : '0'}
                  </span>
                </div>
                <div className='w-full bg-gray-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full'
                    style={{
                      width:
                        project.totalBudget && project.totalActual
                          ? `${Math.min((parseFloat(project.totalActual) / parseFloat(project.totalBudget)) * 100, 100)}%`
                          : '0%',
                    }}
                  />
                </div>
                <p className='text-xs text-gray-500 mt-2'>
                  {project.totalBudget && project.totalActual
                    ? `${((parseFloat(project.totalActual) / parseFloat(project.totalBudget)) * 100).toFixed(1)}% spent`
                    : 'No spending data'}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Team */}
          <Card>
            <CardHeader>
              <CardTitle>Team</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                {project.projectManager && (
                  <div className='flex items-center gap-3'>
                    <div className='h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium'>
                      {project.projectManager.userFirst[0]}
                      {project.projectManager.userLast[0]}
                    </div>
                    <div>
                      <p className='font-medium text-sm'>
                        {project.projectManager.userFirst}{' '}
                        {project.projectManager.userLast}
                      </p>
                      <p className='text-xs text-gray-500'>Project Manager</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
