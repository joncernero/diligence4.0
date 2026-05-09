'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
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

interface PropertyFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingProperty?: any;
  onSuccess?: (property: any) => void;
}

export function PropertyForm({ open, onOpenChange, existingProperty, onSuccess }: PropertyFormProps) {
  const queryClient = useQueryClient();
  const isEditing = !!existingProperty;

  const [formData, setFormData] = useState({
    propName: '',
    propAddress: '',
    propCity: '',
    propState: '',
    propZip: '',
    propType: 'multifamily',
    totalBuildings: '',
    totalUnits: '',
  });

  // Update form when existingProperty changes
  useEffect(() => {
    if (existingProperty) {
      setFormData({
        propName: existingProperty.propName || '',
        propAddress: existingProperty.propAddress || '',
        propCity: existingProperty.propCity || '',
        propState: existingProperty.propState || '',
        propZip: existingProperty.propZip || '',
        propType: existingProperty.propType || 'multifamily',
        totalBuildings: existingProperty.totalBuildings?.toString() || '',
        totalUnits: existingProperty.totalUnits?.toString() || '',
      });
    } else {
      resetForm();
    }
  }, [existingProperty]);

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      isEditing
        ? propertiesApi.update(existingProperty.id, data)
        : propertiesApi.create(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      queryClient.invalidateQueries({ queryKey: ['property'] });
      queryClient.invalidateQueries({ queryKey: ['project'] });
      onOpenChange(false);
      resetForm();
      if (onSuccess) {
        onSuccess(response.data.property);
      }
    },
  });

  const resetForm = () => {
    setFormData({
      propName: '',
      propAddress: '',
      propCity: '',
      propState: '',
      propZip: '',
      propType: 'multifamily',
      totalBuildings: '',
      totalUnits: '',
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      propName: formData.propName,
      propAddress: formData.propAddress || null,
      propCity: formData.propCity || null,
      propState: formData.propState || null,
      propZip: formData.propZip || null,
      propType: formData.propType,
      totalBuildings: formData.totalBuildings ? parseInt(formData.totalBuildings) : null,
      totalUnits: formData.totalUnits ? parseInt(formData.totalUnits) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Property' : 'Add Property'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update property details' : 'Create a new property'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propName">
              Property Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="propName"
              placeholder="e.g., Riverside Apartments"
              value={formData.propName}
              onChange={(e) => setFormData(prev => ({ ...prev, propName: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="propAddress">Address</Label>
            <Input
              id="propAddress"
              placeholder="123 Main Street"
              value={formData.propAddress}
              onChange={(e) => setFormData(prev => ({ ...prev, propAddress: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propCity">City</Label>
              <Input
                id="propCity"
                placeholder="Indianapolis"
                value={formData.propCity}
                onChange={(e) => setFormData(prev => ({ ...prev, propCity: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propState">State</Label>
              <Input
                id="propState"
                placeholder="IN"
                maxLength={2}
                value={formData.propState}
                onChange={(e) => setFormData(prev => ({ ...prev, propState: e.target.value.toUpperCase() }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="propZip">ZIP Code</Label>
              <Input
                id="propZip"
                placeholder="46038"
                value={formData.propZip}
                onChange={(e) => setFormData(prev => ({ ...prev, propZip: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="propType">Property Type</Label>
              <Select
                value={formData.propType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, propType: value }))}
              >
                <SelectTrigger id="propType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multifamily">Multifamily</SelectItem>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="mixed_use">Mixed Use</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalBuildings">Total Buildings</Label>
              <Input
                id="totalBuildings"
                type="number"
                placeholder="4"
                value={formData.totalBuildings}
                onChange={(e) => setFormData(prev => ({ ...prev, totalBuildings: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalUnits">Total Units</Label>
              <Input
                id="totalUnits"
                type="number"
                placeholder="120"
                value={formData.totalUnits}
                onChange={(e) => setFormData(prev => ({ ...prev, totalUnits: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending
                ? isEditing ? 'Saving...' : 'Creating...'
                : isEditing ? 'Save Changes' : 'Create Property'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
