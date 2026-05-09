'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { observationsApi, usersApi } from '@/lib/api';
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

interface AddObservationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walkId: number;
  projectId: number;
}

export function AddObservationForm({ open, onOpenChange, walkId, projectId }: AddObservationFormProps) {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: 'deficiency',
    severity: 'minor',
    priority: 'medium',
    tradeType: 'other',
    assignedTo: '',
  });

  const [error, setError] = useState('');

  // Fetch users for assignment
  const { data: usersData } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await usersApi.getAll();
      return res.data.users;
    },
  });

  const users = usersData || [];

  const createMutation = useMutation({
    mutationFn: (data: any) => observationsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observations'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to create observation');
    },
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      category: 'deficiency',
      severity: 'minor',
      priority: 'medium',
      tradeType: 'other',
      assignedTo: '',
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.title) {
      setError('Title is required');
      return;
    }

    createMutation.mutate({
      walkId,
      projectId,
      title: formData.title,
      description: formData.description || null,
      location: formData.location || null,
      category: formData.category,
      severity: formData.severity,
      priority: formData.priority,
      tradeType: formData.tradeType,
      assignedTo: formData.assignedTo ? parseInt(formData.assignedTo) : null,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Observation</DialogTitle>
          <DialogDescription>
            Record a new observation or deficiency found during the walk
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g., Drywall crack in unit 203"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="Detailed description of the observation..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Building A, Unit 203, Living Room"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleChange('category', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deficiency">Deficiency</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="quality">Quality</SelectItem>
                  <SelectItem value="code_violation">Code Violation</SelectItem>
                  <SelectItem value="punch_item">Punch Item</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Severity */}
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select
                value={formData.severity}
                onValueChange={(value) => handleChange('severity', value)}
              >
                <SelectTrigger id="severity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="major">Major</SelectItem>
                  <SelectItem value="minor">Minor</SelectItem>
                  <SelectItem value="cosmetic">Cosmetic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Trade Type */}
            <div className="space-y-2">
              <Label htmlFor="tradeType">Trade</Label>
              <Select
                value={formData.tradeType}
                onValueChange={(value) => handleChange('tradeType', value)}
              >
                <SelectTrigger id="tradeType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="plumbing">Plumbing</SelectItem>
                  <SelectItem value="electrical">Electrical</SelectItem>
                  <SelectItem value="hvac">HVAC</SelectItem>
                  <SelectItem value="framing">Framing</SelectItem>
                  <SelectItem value="drywall">Drywall</SelectItem>
                  <SelectItem value="paint">Paint</SelectItem>
                  <SelectItem value="flooring">Flooring</SelectItem>
                  <SelectItem value="roofing">Roofing</SelectItem>
                  <SelectItem value="concrete">Concrete</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assign To - NEW FIELD */}
          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(value) => handleChange('assignedTo', value)}
            >
              <SelectTrigger id="assignedTo">
                <SelectValue placeholder="Unassigned (click to assign)" />
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
              onClick={() => { onOpenChange(false); resetForm(); }}
              disabled={createMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Observation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
