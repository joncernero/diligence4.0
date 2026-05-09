'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { walksApi } from '@/lib/api';
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

interface ScheduleWalkFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  propertyId: number;
}

export function ScheduleWalkForm({ open, onOpenChange, projectId, propertyId }: ScheduleWalkFormProps) {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);

  const [formData, setFormData] = useState({
    walkDate: '',
    walkTime: '09:00',
    walkType: 'progress',
    notes: '',
    weatherConditions: '',
  });

  const [error, setError] = useState('');

  const createWalkMutation = useMutation({
    mutationFn: (data: any) => walksApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walks'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to schedule walk');
    },
  });

  const resetForm = () => {
    setFormData({
      walkDate: '',
      walkTime: '09:00',
      walkType: 'progress',
      notes: '',
      weatherConditions: '',
    });
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.walkDate) {
      setError('Walk date is required');
      return;
    }

    // Combine date and time
    const walkDateTime = new Date(`${formData.walkDate}T${formData.walkTime}`);

    createWalkMutation.mutate({
      projectId,
      propertyId,
      walkDate: walkDateTime.toISOString(),
      walkType: formData.walkType,
      conductedBy: user?.id,
      notes: formData.notes || null,
      weatherConditions: formData.weatherConditions || null,
    });
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule Property Walk</DialogTitle>
          <DialogDescription>
            Schedule a new property walk for this project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="walkDate">
                Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="walkDate"
                type="date"
                value={formData.walkDate}
                onChange={(e) => handleChange('walkDate', e.target.value)}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Time */}
            <div className="space-y-2">
              <Label htmlFor="walkTime">Time</Label>
              <Input
                id="walkTime"
                type="time"
                value={formData.walkTime}
                onChange={(e) => handleChange('walkTime', e.target.value)}
              />
            </div>
          </div>

          {/* Walk Type */}
          <div className="space-y-2">
            <Label htmlFor="walkType">Walk Type</Label>
            <Select
              value={formData.walkType}
              onValueChange={(value) => handleChange('walkType', value)}
            >
              <SelectTrigger id="walkType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pre_construction">Pre-Construction</SelectItem>
                <SelectItem value="progress">Progress Walk</SelectItem>
                <SelectItem value="final">Final Walk</SelectItem>
                <SelectItem value="punch_list">Punch List</SelectItem>
                <SelectItem value="warranty">Warranty Walk</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Weather */}
          <div className="space-y-2">
            <Label htmlFor="weatherConditions">Weather Conditions</Label>
            <Input
              id="weatherConditions"
              placeholder="e.g., Sunny, 72°F"
              value={formData.weatherConditions}
              onChange={(e) => handleChange('weatherConditions', e.target.value)}
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <textarea
              id="notes"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Any additional notes or preparation required..."
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
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
              disabled={createWalkMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createWalkMutation.isPending}>
              {createWalkMutation.isPending ? 'Scheduling...' : 'Schedule Walk'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
