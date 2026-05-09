'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectsApi, usersApi, propertiesApi } from '@/lib/api';
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

interface EditProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
}

export function EditProjectModal({ open, onOpenChange, project }: EditProjectModalProps) {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    projectName: '',
    projectNumber: '',
    propertyId: '',
    projectManagerId: '',
    superintendentId: '',
    status: 'active',
    startDate: '',
    endDate: '',
    budget: '',
    description: '',
  });

  // Fetch users for dropdowns
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return res.data.users;
    },
  });

  // Fetch properties for dropdown
  const { data: propertiesData } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await propertiesApi.getAll();
      return res.data.properties;
    },
  });

  const users = usersData || [];
  const properties = propertiesData || [];

  // Populate form when project changes
  useEffect(() => {
    if (project) {
      setFormData({
        projectName: project.projectName || '',
        projectNumber: project.projectNumber || '',
        propertyId: project.propertyId?.toString() || '',
        projectManagerId: project.projectManagerId?.toString() || '',
        superintendentId: project.superintendentId?.toString() || '',
        status: project.status || 'active',
        startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
        endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
        budget: project.budget?.toString() || '',
        description: project.description || '',
      });
    }
  }, [project]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => projectsApi.update(project.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      projectName: formData.projectName,
      projectNumber: formData.projectNumber,
      propertyId: formData.propertyId ? parseInt(formData.propertyId) : null,
      projectManagerId: formData.projectManagerId ? parseInt(formData.projectManagerId) : null,
      superintendentId: formData.superintendentId ? parseInt(formData.superintendentId) : null,
      status: formData.status,
      startDate: formData.startDate || null,
      endDate: formData.endDate || null,
      budget: formData.budget ? parseFloat(formData.budget) : null,
      description: formData.description || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>
            Update project details and assignments
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="projectName">
                Project Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projectName"
                value={formData.projectName}
                onChange={(e) => setFormData(prev => ({ ...prev, projectName: e.target.value }))}
                required
              />
            </div>

            {/* Project Number */}
            <div className="space-y-2">
              <Label htmlFor="projectNumber">
                Project Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="projectNumber"
                value={formData.projectNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, projectNumber: e.target.value }))}
                required
              />
            </div>
          </div>

          {/* Property */}
          <div className="space-y-2">
            <Label htmlFor="property">Property</Label>
            <Select
              value={formData.propertyId}
              onValueChange={(value) => setFormData(prev => ({ ...prev, propertyId: value }))}
            >
              <SelectTrigger id="property">
                <SelectValue placeholder="Select property..." />
              </SelectTrigger>
              <SelectContent>
                {properties.map((property: any) => (
                  <SelectItem key={property.id} value={property.id.toString()}>
                    {property.propName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Project Manager */}
            <div className="space-y-2">
              <Label htmlFor="pm">Project Manager</Label>
              <Select
                value={formData.projectManagerId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, projectManagerId: value }))}
              >
                <SelectTrigger id="pm">
                  <SelectValue placeholder="Select PM..." />
                </SelectTrigger>
                <SelectContent>
                  {users.filter((u: any) => u.userRole === 'pm' || u.userRole === 'admin').map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.userFirst} {user.userLast}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Superintendent */}
            <div className="space-y-2">
              <Label htmlFor="super">Superintendent</Label>
              <Select
                value={formData.superintendentId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, superintendentId: value }))}
              >
                <SelectTrigger id="super">
                  <SelectValue placeholder="Select super..." />
                </SelectTrigger>
                <SelectContent>
                  {users.filter((u: any) => u.userRole === 'super' || u.userRole === 'admin').map((user: any) => (
                    <SelectItem key={user.id} value={user.id.toString()}>
                      {user.userFirst} {user.userLast}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
          </div>

          {/* Budget */}
          <div className="space-y-2">
            <Label htmlFor="budget">Budget</Label>
            <Input
              id="budget"
              type="number"
              step="0.01"
              placeholder="1500000.00"
              value={formData.budget}
              onChange={(e) => setFormData(prev => ({ ...prev, budget: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Project description..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
