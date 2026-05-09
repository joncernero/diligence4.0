'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateProjectForm } from '@/components/CreateProjectForm';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export default function ProjectsPage() {
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await projectsApi.getAll();
      return response.data.projects;
    },
  });

  const projects = projectsData || [];

  return (
    <div>
      <div className='flex items-center justify-between mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Projects</h1>
          <p className='text-gray-500 mt-1'>
            Manage all your construction projects
          </p>
        </div>
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className='h-4 w-4 mr-2' />
          New Project
        </Button>
      </div>

      <CreateProjectForm
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      {isLoading ? (
        <div className='text-center py-12'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
          <p className='mt-4 text-sm text-gray-500'>Loading projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <Card>
          <CardContent className='py-12 text-center'>
            <p className='text-gray-500'>
              No projects yet. Create your first project to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {projects.map((project: any) => (
            <Link
              href={`/dashboard/projects/${project.id}`}
              key={project.id}
              className='group'>
              <Card className='h-full hover:shadow-xl transition-all duration-200 border-2 hover:border-primary/20 cursor-pointer'>
                <CardHeader className='pb-3'>
                  <div className='flex items-start justify-between gap-3'>
                    <div className='flex-1 min-w-0'>
                      <CardTitle className='text-lg group-hover:text-primary transition-colors line-clamp-1'>
                        {project.projectName}
                      </CardTitle>
                      <p className='text-sm text-muted-foreground mt-1.5'>
                        {project.projectNumber}
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                        project.projectStatus === 'active'
                          ? 'bg-green-100 text-green-700 ring-1 ring-green-600/20'
                          : project.projectStatus === 'proposal'
                            ? 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20'
                            : project.projectStatus === 'lead'
                              ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20'
                              : 'bg-gray-100 text-gray-700 ring-1 ring-gray-600/20'
                      }`}>
                      {project.projectStatus}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className='pt-0'>
                  <div className='space-y-3'>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground font-medium'>
                        Type
                      </span>
                      <span className='font-semibold text-foreground capitalize'>
                        {project.projectType?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground font-medium'>
                        Department
                      </span>
                      <span className='font-semibold text-foreground capitalize'>
                        {project.projectDepartment?.replace('_', ' ') || 'N/A'}
                      </span>
                    </div>
                    {project.projectManager && (
                      <div className='flex items-center justify-between text-sm pt-2 border-t'>
                        <span className='text-muted-foreground font-medium'>
                          PM
                        </span>
                        <span className='font-semibold text-foreground'>
                          {project.projectManager.userFirst}{' '}
                          {project.projectManager.userLast}
                        </span>
                      </div>
                    )}
                    {project.totalBudget && (
                      <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground font-medium'>
                          Budget
                        </span>
                        <span className='font-bold text-primary'>
                          ${parseFloat(project.totalBudget).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {project.startDate && (
                      <div className='flex items-center justify-between text-sm pt-2 border-t'>
                        <span className='text-muted-foreground font-medium'>
                          Start Date
                        </span>
                        <span className='font-semibold text-foreground'>
                          {new Date(project.startDate).toLocaleDateString()}
                        </span>
                      </div>
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
