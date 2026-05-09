'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { scopeApi, csiCodesApi, unitTypesApi } from '@/lib/api';
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

interface ScopeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: number;
  propertyId?: number;
  existingScope?: any;
}

export function ScopeForm({
  open,
  onOpenChange,
  projectId,
  propertyId,
  existingScope,
}: ScopeFormProps) {
  const queryClient = useQueryClient();
  const user = useAuth((state) => state.user);
  const isEditing = !!existingScope;

  const [formData, setFormData] = useState({
    scopeName: existingScope?.scopeName || '',
    description: existingScope?.description || '',
    csiCodeId: existingScope?.csiCodeId?.toString() || '',
    estimatedCost: existingScope?.estimatedCost || '',
    status: existingScope?.status || 'planned',
    appliesToAllUnits: existingScope?.appliesToAllUnits || false,
    selectedUnitTypes: existingScope?.appliesToUnitTypes || [],
    notes: existingScope?.notes || '',
  });

  const [error, setError] = useState('');
  const [csiSearch, setCsiSearch] = useState('');

  // Fetch CSI codes
  const { data: csiData } = useQuery({
    queryKey: ['csiCodes'],
    queryFn: async () => {
      const res = await csiCodesApi.getAll();
      return res.data.codes;
    },
  });

  // Fetch unit types (if propertyId provided)
  const { data: unitTypesData } = useQuery({
    queryKey: ['unitTypes', propertyId],
    queryFn: async () => {
      if (!propertyId) return [];
      const res = await unitTypesApi.getAll(propertyId);
      return res.data.unitTypes;
    },
    enabled: !!propertyId,
  });

  const csiCodes = csiData || [];
  const unitTypes = unitTypesData || [];

  // Filter CSI codes by search
  const filteredCodes = csiCodes.filter((code: any) =>
    csiSearch
      ? code.code.toLowerCase().includes(csiSearch.toLowerCase()) ||
        code.title.toLowerCase().includes(csiSearch.toLowerCase()) ||
        code.divisionTitle?.toLowerCase().includes(csiSearch.toLowerCase())
      : true,
  );

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      isEditing
        ? scopeApi.update(existingScope.id, data)
        : scopeApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scope'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to save scope item');
    },
  });

  const resetForm = () => {
    setFormData({
      scopeName: '',
      description: '',
      csiCodeId: '',
      estimatedCost: '',
      status: 'planned',
      appliesToAllUnits: false,
      selectedUnitTypes: [],
      notes: '',
    });
    setCsiSearch('');
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.scopeName) {
      setError('Scope name is required');
      return;
    }

    createMutation.mutate({
      projectId,
      scopeName: formData.scopeName,
      description: formData.description || null,
      csiCodeId:
        formData.csiCodeId && formData.csiCodeId !== ''
          ? parseInt(formData.csiCodeId)
          : null,
      estimatedCost:
        formData.estimatedCost && formData.estimatedCost !== ''
          ? parseFloat(formData.estimatedCost)
          : null,
      status: formData.status,
      appliesToAllUnits: formData.appliesToAllUnits,
      appliesToUnitTypes: formData.appliesToAllUnits
        ? null
        : formData.selectedUnitTypes.length > 0
          ? formData.selectedUnitTypes
          : null,
      notes: formData.notes || null,
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleUnitType = (unitTypeId: number) => {
    setFormData((prev) => ({
      ...prev,
      selectedUnitTypes: prev.selectedUnitTypes.includes(unitTypeId)
        ? prev.selectedUnitTypes.filter((id: number) => id !== unitTypeId)
        : [...prev.selectedUnitTypes, unitTypeId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Scope Item' : 'Add Scope Item'}
          </DialogTitle>
          <DialogDescription>
            Define work to be done and link to CSI codes for budgeting
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Scope Name */}
          <div className='space-y-2'>
            <Label htmlFor='scopeName'>
              Scope Name <span className='text-destructive'>*</span>
            </Label>
            <Input
              id='scopeName'
              placeholder='e.g., Kitchen Renovation, HVAC Installation'
              value={formData.scopeName}
              onChange={(e) => handleChange('scopeName', e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <textarea
              id='description'
              className='flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              placeholder='Detailed description of the work...'
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
          </div>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {/* CSI Code */}
            <div className='space-y-2'>
              <Label htmlFor='csiCode'>CSI Code</Label>
              <Input
                placeholder='Search codes...'
                value={csiSearch}
                onChange={(e) => setCsiSearch(e.target.value)}
                className='mb-2'
              />
              <Select
                value={formData.csiCodeId}
                onValueChange={(value) => handleChange('csiCodeId', value)}>
                <SelectTrigger id='csiCode'>
                  <SelectValue placeholder='Select CSI code...' />
                </SelectTrigger>
                <SelectContent className='max-h-[200px]'>
                  {filteredCodes.map((code: any) => (
                    <SelectItem key={code.id} value={code.id.toString()}>
                      {code.code} - {code.title} ({code.formatVersion})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estimated Cost */}
            <div className='space-y-2'>
              <Label htmlFor='estimatedCost'>Estimated Cost</Label>
              <Input
                id='estimatedCost'
                type='number'
                step='0.01'
                placeholder='25000.00'
                value={formData.estimatedCost}
                onChange={(e) => handleChange('estimatedCost', e.target.value)}
              />
            </div>
          </div>

          {/* Status */}
          <div className='space-y-2'>
            <Label htmlFor='status'>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger id='status'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='planned'>Planned</SelectItem>
                <SelectItem value='in_progress'>In Progress</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='on_hold'>On Hold</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Unit Types */}
          {unitTypes.length > 0 && (
            <div className='space-y-2'>
              <Label>Applies To</Label>
              <div className='border rounded-lg p-4 space-y-3'>
                <label className='flex items-center gap-2 cursor-pointer'>
                  <input
                    type='checkbox'
                    checked={formData.appliesToAllUnits}
                    onChange={(e) =>
                      handleChange('appliesToAllUnits', e.target.checked)
                    }
                    className='rounded border-gray-300'
                  />
                  <span className='font-medium'>All Unit Types</span>
                </label>

                {!formData.appliesToAllUnits && (
                  <div className='space-y-2 pl-6'>
                    {unitTypes.map((type: any) => (
                      <label
                        key={type.id}
                        className='flex items-center gap-2 cursor-pointer'>
                        <input
                          type='checkbox'
                          checked={formData.selectedUnitTypes.includes(type.id)}
                          onChange={() => toggleUnitType(type.id)}
                          className='rounded border-gray-300'
                        />
                        <span>{type.typeName}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className='space-y-2'>
            <Label htmlFor='notes'>Notes</Label>
            <textarea
              id='notes'
              className='flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              placeholder='Additional notes...'
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
            />
          </div>

          {/* Error */}
          {error && (
            <div className='rounded-md bg-destructive/15 p-3 text-sm text-destructive'>
              {error}
            </div>
          )}

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onOpenChange(false);
                resetForm();
              }}
              disabled={createMutation.isPending}>
              Cancel
            </Button>
            <Button type='submit' disabled={createMutation.isPending}>
              {createMutation.isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Scope Item'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
