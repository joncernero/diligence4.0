'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { bulletinsApi } from '@/lib/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { CalendarDays } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  propertyId: number;
}

// Categories where a scheduled date is meaningful
const DATE_RELEVANT_CATEGORIES = ['work_notice', 'utility_shutoff', 'access_notice'];

const categoryLabels: Record<string, string> = {
  general:         'General',
  work_notice:     'Work Notice',
  utility_shutoff: 'Utility Shutoff',
  access_notice:   'Access Notice',
  completion:      'Completion',
};

const categoryHelp: Record<string, string> = {
  work_notice:     'Scheduled date will appear on the resident calendar as a Work Date.',
  utility_shutoff: 'Scheduled date will appear on the resident calendar as a Utility Shutoff.',
  access_notice:   'Scheduled date will appear on the resident calendar as an Access Notice.',
};

export function CreateBulletinModal({ open, onOpenChange, projectId, propertyId }: Props) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '',
    body: '',
    category: 'general',
    targetType: 'all',
    targetUnitNumber: '',
    scheduledDate: '',
    sendPush: true,
  });

  const showDateField = DATE_RELEVANT_CATEGORIES.includes(form.category);

  const createMutation = useMutation({
    mutationFn: () =>
      bulletinsApi.create({
        ...form,
        projectId,
        propertyId,
        scheduledDate: form.scheduledDate ? new Date(form.scheduledDate).toISOString() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bulletins'] });
      setForm({
        title: '',
        body: '',
        category: 'general',
        targetType: 'all',
        targetUnitNumber: '',
        scheduledDate: '',
        sendPush: true,
      });
      onOpenChange(false);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Post Bulletin</DialogTitle>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          {/* Category */}
          <div className='space-y-1.5'>
            <Label>Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) =>
                setForm({ ...form, category: v, scheduledDate: '' })
              }>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Scheduled date — only for date-relevant categories */}
          {showDateField && (
            <div className='space-y-1.5'>
              <Label className='flex items-center gap-1.5'>
                <CalendarDays className='h-3.5 w-3.5 text-muted-foreground' />
                Scheduled Date & Time
                <span className='text-muted-foreground font-normal'>(optional)</span>
              </Label>
              <Input
                type='datetime-local'
                value={form.scheduledDate}
                onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              />
              {categoryHelp[form.category] && (
                <p className='text-xs text-blue-600 flex items-start gap-1.5'>
                  <CalendarDays className='h-3 w-3 mt-0.5 shrink-0' />
                  {categoryHelp[form.category]}
                </p>
              )}
            </div>
          )}

          {/* Title */}
          <div className='space-y-1.5'>
            <Label>Title</Label>
            <Input
              placeholder='e.g. Water shutoff Tuesday 9am–12pm'
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* Body */}
          <div className='space-y-1.5'>
            <Label>Message</Label>
            <Textarea
              placeholder='Provide details for residents…'
              value={form.body}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm({ ...form, body: e.target.value })
              }
              rows={4}
              className='text-base md:text-sm'
            />
          </div>

          {/* Send to */}
          <div className='space-y-1.5'>
            <Label>Send to</Label>
            <Select
              value={form.targetType}
              onValueChange={(v) => setForm({ ...form, targetType: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All residents</SelectItem>
                <SelectItem value='unit'>Specific unit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {form.targetType === 'unit' && (
            <div className='space-y-1.5'>
              <Label>Unit number</Label>
              <Input
                placeholder='e.g. 4B'
                value={form.targetUnitNumber}
                onChange={(e) => setForm({ ...form, targetUnitNumber: e.target.value })}
              />
            </div>
          )}

          {/* Push notification */}
          <label className='flex items-center gap-3 cursor-pointer'>
            <input
              type='checkbox'
              checked={form.sendPush}
              onChange={(e) => setForm({ ...form, sendPush: e.target.checked })}
              className='h-4 w-4 rounded border-gray-300 accent-blue-600'
            />
            <span className='text-sm'>Send push notification to residents</span>
          </label>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!form.title || !form.body || createMutation.isPending}>
            {createMutation.isPending ? 'Posting…' : 'Post Bulletin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
