'use client';

import { useState } from 'react';
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
import { Building2 } from 'lucide-react';

interface BuildingCountsFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unitType: any;
  buildings: any[];
  propertyId: number;
}

export function BuildingCountsForm({
  open,
  onOpenChange,
  unitType,
  buildings,
  propertyId,
}: BuildingCountsFormProps) {
  const queryClient = useQueryClient();

  // Initialize counts from existing data
  const getInitialCounts = () => {
    const counts: Record<number, number> = {};
    buildings.forEach((b) => {
      const existing = unitType.buildingCounts?.find((bc: any) => bc.buildingId === b.id);
      counts[b.id] = existing?.count || 0;
    });
    return counts;
  };

  const [counts, setCounts] = useState<Record<number, number>>(getInitialCounts);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError('');

    try {
      // Save each building count
      for (const building of buildings) {
        await unitTypesApi.setBuildingCount(unitType.id, {
          buildingId: building.id,
          count: counts[building.id] || 0,
        });
      }

      queryClient.invalidateQueries({ queryKey: ['unitTypes'] });
      onOpenChange(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save counts');
    } finally {
      setSaving(false);
    }
  };

  const handleCountChange = (buildingId: number, value: string) => {
    const num = parseInt(value) || 0;
    setCounts((prev) => ({ ...prev, [buildingId]: num }));
  };

  const totalUnits = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Set Unit Counts — {unitType?.typeName}</DialogTitle>
          <DialogDescription>
            Enter how many {unitType?.typeName} units are in each building
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {buildings.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">
              No buildings found for this property
            </p>
          ) : (
            <>
              {buildings.map((building) => (
                <div key={building.id} className="flex items-center gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        Building {building.buildingNumber}
                      </p>
                      {building.buildingName && (
                        <p className="text-xs text-muted-foreground">{building.buildingName}</p>
                      )}
                    </div>
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      value={counts[building.id] || 0}
                      onChange={(e) => handleCountChange(building.id, e.target.value)}
                      className="text-center font-semibold"
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-12">units</span>
                </div>
              ))}

              {/* Total */}
              <div className="pt-4 border-t flex items-center justify-between">
                <span className="font-semibold">Total {unitType?.typeName} Units</span>
                <span className="text-2xl font-bold text-primary">{totalUnits}</span>
              </div>
            </>
          )}

          {error && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save Counts'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
