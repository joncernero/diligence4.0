'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { unitTypesApi } from '@/lib/api';
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
import { Upload, FileText } from 'lucide-react';

interface UnitTypeFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: number;
  existingType?: any; // For editing
}

export function UnitTypeForm({ open, onOpenChange, propertyId, existingType }: UnitTypeFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isEditing = !!existingType;

  const [formData, setFormData] = useState({
    typeName: existingType?.typeName || '',
    bedrooms: existingType?.bedrooms?.toString() || '',
    bathrooms: existingType?.bathrooms?.toString() || '',
    squareFootage: existingType?.squareFootage?.toString() || '',
    notes: existingType?.notes || '',
    // Finishes
    flooring: existingType?.finishes?.flooring || '',
    countertops: existingType?.finishes?.countertops || '',
    appliances: existingType?.finishes?.appliances || '',
    cabinets: existingType?.finishes?.cabinets || '',
    fixtures: existingType?.finishes?.fixtures || '',
    // Amenities
    balcony: existingType?.amenities?.balcony || false,
    washerDryer: existingType?.amenities?.washer_dryer || '',
    parking: existingType?.amenities?.parking || '',
    dishwasher: existingType?.amenities?.dishwasher || false,
  });

  const [floorPlanFile, setFloorPlanFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const createMutation = useMutation({
    mutationFn: (data: any) => isEditing
      ? unitTypesApi.update(existingType.id, data)
      : unitTypesApi.create(data),
    onSuccess: async (res) => {
      const unitTypeId = res.data.unitType.id;
      // Upload floor plan if selected
      if (floorPlanFile) {
        const formData = new FormData();
        formData.append('floorPlan', floorPlanFile);
        try {
          await unitTypesApi.uploadFloorPlan(unitTypeId, formData);
        } catch (e) {
          console.error('Floor plan upload failed:', e);
        }
      }
      queryClient.invalidateQueries({ queryKey: ['unitTypes'] });
      onOpenChange(false);
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to save unit type');
    },
  });

  const resetForm = () => {
    setFormData({
      typeName: '', bedrooms: '', bathrooms: '', squareFootage: '',
      notes: '', flooring: '', countertops: '', appliances: '',
      cabinets: '', fixtures: '', balcony: false, washerDryer: '',
      parking: '', dishwasher: false,
    });
    setFloorPlanFile(null);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.typeName || !formData.bedrooms || !formData.bathrooms) {
      setError('Name, bedrooms, and bathrooms are required');
      return;
    }

    createMutation.mutate({
      propertyId,
      typeName: formData.typeName,
      bedrooms: parseInt(formData.bedrooms),
      bathrooms: parseFloat(formData.bathrooms),
      squareFootage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
      notes: formData.notes || null,
      finishes: {
        flooring: formData.flooring || null,
        countertops: formData.countertops || null,
        appliances: formData.appliances || null,
        cabinets: formData.cabinets || null,
        fixtures: formData.fixtures || null,
      },
      amenities: {
        balcony: formData.balcony,
        washer_dryer: formData.washerDryer || null,
        parking: formData.parking || null,
        dishwasher: formData.dishwasher,
      },
    });
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFloorPlanFile(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Unit Type' : 'Add Unit Type'}</DialogTitle>
          <DialogDescription>
            Define a standard unit layout for this property
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="typeName">
                  Type Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="typeName"
                  placeholder="e.g. 2bed/2bath"
                  value={formData.typeName}
                  onChange={(e) => handleChange('typeName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedrooms">
                  Bedrooms <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bedrooms"
                  type="number"
                  min="0"
                  placeholder="2"
                  value={formData.bedrooms}
                  onChange={(e) => handleChange('bedrooms', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathrooms">
                  Bathrooms <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="bathrooms"
                  type="number"
                  min="0"
                  step="0.5"
                  placeholder="2"
                  value={formData.bathrooms}
                  onChange={(e) => handleChange('bathrooms', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="squareFootage">Square Footage</Label>
                <Input
                  id="squareFootage"
                  type="number"
                  placeholder="1200"
                  value={formData.squareFootage}
                  onChange={(e) => handleChange('squareFootage', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Standard Finishes */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Standard Finishes
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { id: 'flooring', label: 'Flooring', placeholder: 'e.g. LVP, Hardwood, Tile' },
                { id: 'countertops', label: 'Countertops', placeholder: 'e.g. Quartz, Granite' },
                { id: 'appliances', label: 'Appliances', placeholder: 'e.g. Stainless Steel' },
                { id: 'cabinets', label: 'Cabinets', placeholder: 'e.g. White Shaker' },
                { id: 'fixtures', label: 'Fixtures', placeholder: 'e.g. Brushed Nickel' },
              ].map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label htmlFor={field.id}>{field.label}</Label>
                  <Input
                    id={field.id}
                    placeholder={field.placeholder}
                    value={(formData as any)[field.id]}
                    onChange={(e) => handleChange(field.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Amenities
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="washerDryer">Washer/Dryer</Label>
                <Input
                  id="washerDryer"
                  placeholder="e.g. In-unit, Hookups, None"
                  value={formData.washerDryer}
                  onChange={(e) => handleChange('washerDryer', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="parking">Parking</Label>
                <Input
                  id="parking"
                  placeholder="e.g. Assigned, Garage, Street"
                  value={formData.parking}
                  onChange={(e) => handleChange('parking', e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-6 mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.balcony}
                  onChange={(e) => handleChange('balcony', e.target.checked)}
                />
                <span className="text-sm">Balcony/Patio</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-gray-300"
                  checked={formData.dishwasher}
                  onChange={(e) => handleChange('dishwasher', e.target.checked)}
                />
                <span className="text-sm">Dishwasher</span>
              </label>
            </div>
          </div>

          {/* Floor Plan Upload */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-3">
              Floor Plan
            </h3>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {floorPlanFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="text-left">
                    <p className="font-medium text-sm">{floorPlanFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(floorPlanFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFloorPlanFile(null)}
                  >
                    Remove
                  </Button>
                </div>
              ) : existingType?.floorPlanUrl ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Current floor plan uploaded</p>
                  <a
                    href={existingType.floorPlanUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    View current floor plan
                  </a>
                  <p className="text-xs text-muted-foreground">Upload new to replace</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-muted-foreground">Upload floor plan (PDF or image)</p>
                  <p className="text-xs text-muted-foreground">Max 10MB</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                {floorPlanFile || existingType?.floorPlanUrl ? 'Change File' : 'Select File'}
              </Button>
            </div>
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
              {createMutation.isPending
                ? isEditing ? 'Saving...' : 'Creating...'
                : isEditing ? 'Save Changes' : 'Create Unit Type'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
