'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { workSchedulesApi, projectsApi } from '@/lib/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';

const TRADE_TYPES = [
  { value: 'general', label: 'General / Multiple Trades' },
  { value: 'plumbing', label: 'Plumbing' },
  { value: 'electrical', label: 'Electrical' },
  { value: 'hvac', label: 'HVAC' },
  { value: 'framing', label: 'Framing' },
  { value: 'drywall', label: 'Drywall' },
  { value: 'paint', label: 'Paint' },
  { value: 'flooring', label: 'Flooring' },
  { value: 'roofing', label: 'Roofing' },
  { value: 'concrete', label: 'Concrete' },
  { value: 'landscaping', label: 'Landscaping' },
  { value: 'inspection', label: 'Inspection' },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDate?: Date;
  existingSchedule?: any;
  projectId?: number;
  propertyId?: number;
}

export function WorkScheduleForm({
  open, onOpenChange, defaultDate, existingSchedule, projectId, propertyId,
}: Props) {
  const queryClient = useQueryClient();
  const isEditing = !!existingSchedule;

  const fmt = (d?: Date | string) => {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    return date.toISOString().split('T')[0];
  };

  const [form, setForm] = useState({
    title: '',
    tradeType: 'general',
    contractor: '',
    areaDescription: '',
    unitNumbers: '',   // comma-separated input
    startDate: fmt(defaultDate) || '',
    endDate: fmt(defaultDate) || '',
    notes: '',
    notifyResidents: true,
    projectId: projectId?.toString() || '',
    propertyId: propertyId?.toString() || '',
  });

  // Always fetch projects so we can resolve propertyId from selected project
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await projectsApi.getAll()).data.projects,
  });

  const projects: any[] = projectsData || [];

  // Sync form state when inputs or project data change
  useEffect(() => {
    if (existingSchedule) {
      setForm({
        title: existingSchedule.title || '',
        tradeType: existingSchedule.tradeType || 'general',
        contractor: existingSchedule.contractor || '',
        areaDescription: existingSchedule.areaDescription || '',
        unitNumbers: (existingSchedule.unitNumbers || []).join(', '),
        startDate: fmt(existingSchedule.startDate) || '',
        endDate: fmt(existingSchedule.endDate) || '',
        notes: existingSchedule.notes || '',
        notifyResidents: existingSchedule.notifyResidents !== false,
        projectId: existingSchedule.projectId?.toString() || projectId?.toString() || '',
        propertyId: existingSchedule.propertyId?.toString() || propertyId?.toString() || '',
      });
    } else {
      // Resolve propertyId from the prop or by looking up the project in the fetched list
      const resolvedPropertyId = propertyId?.toString()
        || projects.find((p: any) => p.id === projectId)?.propertyId?.toString()
        || '';
      setForm(f => ({
        ...f,
        startDate: fmt(defaultDate) || f.startDate,
        endDate: fmt(defaultDate) || f.endDate,
        projectId: projectId?.toString() || f.projectId,
        propertyId: resolvedPropertyId || f.propertyId,
      }));
    }
  }, [existingSchedule, defaultDate, projectId, propertyId, projectsData]);

  // When the project selection changes inside the form, auto-populate propertyId
  const handleProjectChange = (projectIdStr: string) => {
    const proj = projects.find((p: any) => p.id.toString() === projectIdStr);
    setForm(f => ({
      ...f,
      projectId: projectIdStr,
      propertyId: proj?.propertyId?.toString() || '',
    }));
  };

  const mutation = useMutation({
    mutationFn: (data: any) =>
      isEditing
        ? workSchedulesApi.update(existingSchedule.id, data)
        : workSchedulesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workSchedules'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => workSchedulesApi.delete(existingSchedule.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workSchedules'] });
      handleClose();
    },
  });

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleSubmit = () => {
    const units = form.unitNumbers
      ? form.unitNumbers.split(',').map(u => u.trim()).filter(Boolean)
      : null;

    mutation.mutate({
      projectId: parseInt(form.projectId),
      propertyId: parseInt(form.propertyId),
      title: form.title,
      tradeType: form.tradeType,
      contractor: form.contractor || null,
      areaDescription: form.areaDescription || null,
      unitNumbers: units?.length ? units : null,
      startDate: form.startDate,
      endDate: form.endDate,
      notes: form.notes || null,
      notifyResidents: form.notifyResidents,
    });
  };

  const set = (key: string, value: any) => setForm(f => ({ ...f, [key]: value }));
  const canSubmit = form.title && form.tradeType && form.startDate && form.endDate
    && form.projectId && form.propertyId;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="w-full max-w-lg mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Work Schedule' : 'Schedule Crew / Work'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. Flooring installation — Building A"
              value={form.title}
              onChange={e => set('title', e.target.value)}
            />
          </div>

          {/* Trade type */}
          <div className="space-y-1.5">
            <Label>Trade / Work Type <span className="text-red-500">*</span></Label>
            <Select value={form.tradeType} onValueChange={v => set('tradeType', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TRADE_TYPES.map(t => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contractor */}
          <div className="space-y-1.5">
            <Label>Contractor / Company <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              placeholder="e.g. ABC Plumbing Co."
              value={form.contractor}
              onChange={e => set('contractor', e.target.value)}
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Start Date <span className="text-red-500">*</span></Label>
              <Input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>End Date <span className="text-red-500">*</span></Label>
              <Input
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={e => set('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* Area */}
          <div className="space-y-1.5">
            <Label>Area / Location <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Input
              placeholder="e.g. Building A, Units 101–110; Lobby"
              value={form.areaDescription}
              onChange={e => set('areaDescription', e.target.value)}
            />
          </div>

          {/* Unit numbers */}
          <div className="space-y-1.5">
            <Label>Specific Unit Numbers <span className="text-muted-foreground text-xs">(optional, comma-separated)</span></Label>
            <Input
              placeholder="e.g. 101, 102, 103"
              value={form.unitNumbers}
              onChange={e => set('unitNumbers', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Residents in these units will see this event on their schedule.
            </p>
          </div>

          {/* Project selector — shown when no project is locked in from the calendar filter */}
          {!projectId && (
            <div className="space-y-1.5">
              <Label>Project <span className="text-red-500">*</span></Label>
              <Select value={form.projectId} onValueChange={handleProjectChange}>
                <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.projectName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.projectId && !form.propertyId && (
                <p className="text-xs text-amber-600">
                  This project has no property linked. Assign a property to the project first.
                </p>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label>Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <textarea
              rows={3}
              placeholder="Any details for the crew or residents…"
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Notify residents toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.notifyResidents}
              onChange={e => set('notifyResidents', e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">
              Show on resident schedule
              <span className="block text-xs text-muted-foreground">
                Residents in the affected units will see this event on their Work Schedule page.
              </span>
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          {isEditing && (
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="sm:mr-auto"
            >
              {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          )}
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? 'Saving…' : isEditing ? 'Save Changes' : 'Create Schedule'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
