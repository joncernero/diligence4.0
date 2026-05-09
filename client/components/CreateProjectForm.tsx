'use client';

import { useState } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { projectsApi, usersApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CreateProjectFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateProjectForm({ open, onOpenChange }: CreateProjectFormProps) {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);

  const [formData, setFormData] = useState({
    projectName: '',
    projectNumber: '',
    projectType: 'new_construction',
    projectStatus: 'proposal',
    projectDepartment: user?.department || 'new_construction',
    startDate: '',
    estimatedCompletion: '',
    totalBudget: '',
  });

  const [error, setError] = useState('');

  // Fetch all users for PM selection
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await usersApi.getAll();
      return response.data.users;
    },
    enabled: open, // Only fetch when modal is open
  });

  const users = usersData || [];
  const projectManagers = users.filter((u: any) => 
    ['pm', 'admin'].includes(u.userRole)
  );

  const createProjectMutation = useMutation({
    mutationFn: (data: any) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create project');
    },
  });

  const resetForm = () => {
    setFormData({
      projectName: '',
      projectNumber: '',
      projectType: 'new_construction',
      projectStatus: 'proposal',
      projectDepartment: user?.department || 'new_construction',
      startDate: '',
      estimatedCompletion: '',
      totalBudget: '',
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.projectName) {
      setError('Project name is required');
      return;
    }

    createProjectMutation.mutate({
      ...formData,
      totalBudget: formData.totalBudget ? parseFloat(formData.totalBudget) : null,
      startDate: formData.startDate || null,
      estimatedCompletion: formData.estimatedCompletion || null,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new construction project to your portfolio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="projectName">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="projectName"
              placeholder="e.g., Riverside Apartments Phase 3"
              value={formData.projectName}
              onChange={(e) => handleChange('projectName', e.target.value)}
              required
            />
          </div>

          {/* Project Number */}
          <div className="space-y-2">
            <Label htmlFor="projectNumber">Project Number</Label>
            <Input
              id="projectNumber"
              placeholder="e.g., RVR-2025-003"
              value={formData.projectNumber}
              onChange={(e) => handleChange('projectNumber', e.target.value)}
            />
          </div>

          {/* Grid: Type, Status, Department */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Project Type */}
            <div className="space-y-2">
              <Label htmlFor="projectType">Project Type</Label>
              <Select
                value={formData.projectType}
                onValueChange={(value) => handleChange('projectType', value)}
              >
                <SelectTrigger id="projectType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_construction">New Construction</SelectItem>
                  <SelectItem value="renovation">Renovation</SelectItem>
                  <SelectItem value="mixed">Mixed Use</SelectItem>
                  <SelectItem value="tenant_improvement">Tenant Improvement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Project Status */}
            <div className="space-y-2">
              <Label htmlFor="projectStatus">Status</Label>
              <Select
                value={formData.projectStatus}
                onValueChange={(value) => handleChange('projectStatus', value)}
              >
                <SelectTrigger id="projectStatus">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lead">Lead</SelectItem>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label htmlFor="projectDepartment">Department</Label>
              <Select
                value={formData.projectDepartment}
                onValueChange={(value) => handleChange('projectDepartment', value)}
              >
                <SelectTrigger id="projectDepartment">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new_construction">New Construction</SelectItem>
                  <SelectItem value="redevelopment">Redevelopment</SelectItem>
                  <SelectItem value="exteriors">Exteriors</SelectItem>
                  <SelectItem value="finance">Finance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Grid: Dates and Budget */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
              />
            </div>

            {/* Estimated Completion */}
            <div className="space-y-2">
              <Label htmlFor="estimatedCompletion">Est. Completion</Label>
              <Input
                id="estimatedCompletion"
                type="date"
                value={formData.estimatedCompletion}
                onChange={(e) => handleChange('estimatedCompletion', e.target.value)}
              />
            </div>

            {/* Total Budget */}
            <div className="space-y-2">
              <Label htmlFor="totalBudget">Total Budget ($)</Label>
              <Input
                id="totalBudget"
                type="number"
                placeholder="5000000"
                value={formData.totalBudget}
                onChange={(e) => handleChange('totalBudget', e.target.value)}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Footer Buttons */}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={createProjectMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
