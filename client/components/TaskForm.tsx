'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tasksApi, projectsApi, usersApi } from '@/lib/api';
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

interface TaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  existingTask?: any;
}

export function TaskForm({ open, onOpenChange, defaultDate, existingTask }: TaskFormProps) {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const isEditing = !!existingTask;

  const [formData, setFormData] = useState({
    projectId: existingTask?.projectId?.toString() || '',
    taskName: existingTask?.taskName || '',
    description: existingTask?.description || '',
    taskType: existingTask?.taskType || 'other',
    scheduledDate: existingTask?.scheduledDate 
      ? new Date(existingTask.scheduledDate).toISOString().split('T')[0]
      : defaultDate?.toISOString().split('T')[0] || '',
    scheduledTime: existingTask?.scheduledDate
      ? new Date(existingTask.scheduledDate).toTimeString().slice(0, 5)
      : '09:00',
    dueDate: existingTask?.dueDate
      ? new Date(existingTask.dueDate).toISOString().split('T')[0]
      : '',
    assignedTo: existingTask?.assignedTo?.toString() || '',
    priority: existingTask?.priority || 'medium',
    notes: existingTask?.notes || '',
  });

  const [error, setError] = useState('');

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectsApi.getAll();
      return res.data.projects;
    },
  });

  // Fetch users
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return res.data.users;
    },
  });

  const projects = projectsData || [];
  const users = usersData || [];

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      isEditing ? tasksApi.update(existingTask.id, data) : tasksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to save task');
    },
  });

  const resetForm = () => {
    setFormData({
      projectId: '',
      taskName: '',
      description: '',
      taskType: 'other',
      scheduledDate: '',
      scheduledTime: '09:00',
      dueDate: '',
      assignedTo: '',
      priority: 'medium',
      notes: '',
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.projectId || !formData.taskName || !formData.scheduledDate) {
      setError('Project, task name, and scheduled date are required');
      return;
    }

    const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);

    createMutation.mutate({
      projectId: parseInt(formData.projectId),
      taskName: formData.taskName,
      description: formData.description || null,
      taskType: formData.taskType,
      scheduledDate: scheduledDateTime.toISOString(),
      dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : null,
      assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
      priority: formData.priority,
      notes: formData.notes || null,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Task' : 'Add Task'}</DialogTitle>
          <DialogDescription>
            Schedule a task or event for a project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="project">
              Project <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => handleChange('projectId', value)}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.projectName} ({project.projectNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Task Name */}
          <div className="space-y-2">
            <Label htmlFor="taskName">
              Task Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="taskName"
              placeholder="e.g., Client Meeting, Material Delivery"
              value={formData.taskName}
              onChange={(e) => handleChange('taskName', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Task details..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Task Type */}
            <div className="space-y-2">
              <Label htmlFor="taskType">Task Type</Label>
              <Select
                value={formData.taskType}
                onValueChange={(value) => handleChange('taskType', value)}
              >
                <SelectTrigger id="taskType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="deadline">Deadline</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="milestone">Milestone</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => handleChange('priority', value)}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scheduled Date */}
            <div className="space-y-2">
              <Label htmlFor="scheduledDate">
                Scheduled Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="scheduledDate"
                type="date"
                value={formData.scheduledDate}
                onChange={(e) => handleChange('scheduledDate', e.target.value)}
                required
              />
            </div>

            {/* Scheduled Time */}
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Time</Label>
              <Input
                id="scheduledTime"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => handleChange('scheduledTime', e.target.value)}
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date (Optional)</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => handleChange('dueDate', e.target.value)}
            />
          </div>

          {/* Assigned To */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => handleChange('assignedTo', value)}
            >
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Select user..." />
              </SelectTrigger>
              <SelectContent>
                {users.map((user: any) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.userFirst} {user.userLast} ({user.userRole})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? isEditing ? 'Saving...' : 'Creating...'
                : isEditing ? 'Save Changes' : 'Create Task'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
