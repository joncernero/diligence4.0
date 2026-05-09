'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { propertiesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Edit, Trash2, Building2, Home } from 'lucide-react';

export default function PropertiesPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any>(null);
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

  // Fetch properties
  const { data: propertiesData, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: async () => {
      const res = await propertiesApi.getAll();
      return res.data.properties;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      editingProperty
        ? propertiesApi.update(editingProperty.id, data)
        : propertiesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
      handleCloseForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => propertiesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['properties'] });
    },
  });

  const properties = propertiesData || [];

  const handleOpenForm = (property?: any) => {
    if (property) {
      setEditingProperty(property);
      setFormData({
        propName: property.propName,
        propAddress: property.propAddress || '',
        propCity: property.propCity || '',
        propState: property.propState || '',
        propZip: property.propZip || '',
        propType: property.propType || 'multifamily',
        totalBuildings: property.totalBuildings?.toString() || '',
        totalUnits: property.totalUnits?.toString() || '',
      });
    } else {
      setEditingProperty(null);
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
    }
    setFormOpen(true);
  };

  const handleCloseForm = () => {
    setFormOpen(false);
    setEditingProperty(null);
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

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete property "${name}"? This will also delete all associated buildings and units.`)) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Properties</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage all properties and buildings
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Add Property
        </Button>
      </div>

      {/* Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add Property'}</DialogTitle>
            <DialogDescription>
              {editingProperty ? 'Update property details' : 'Create a new property'}
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
              <Button type="button" variant="outline" onClick={handleCloseForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending
                  ? editingProperty ? 'Saving...' : 'Creating...'
                  : editingProperty ? 'Save Changes' : 'Create Property'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Properties List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-sm text-gray-500">Loading properties...</p>
          </div>
        </div>
      ) : properties.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Building2 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Properties Yet</h3>
            <p className="text-muted-foreground mb-6">
              Create your first property to get started
            </p>
            <Button onClick={() => handleOpenForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add First Property
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((property: any) => (
            <Card key={property.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{property.propName}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {property.propAddress}
                      {property.propCity && `, ${property.propCity}`}
                      {property.propState && `, ${property.propState}`}
                    </p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-blue-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">
                      {property.propType?.replace('_', ' ')}
                    </span>
                  </div>
                  {property.totalBuildings && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Buildings</span>
                      <span className="font-semibold">{property.totalBuildings}</span>
                    </div>
                  )}
                  {property.totalUnits && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Units</span>
                      <span className="font-semibold">{property.totalUnits}</span>
                    </div>
                  )}
                  <div className="pt-3 border-t flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleOpenForm(property)}
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(property.id, property.propName)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
