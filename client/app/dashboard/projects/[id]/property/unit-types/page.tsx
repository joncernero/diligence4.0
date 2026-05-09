'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, propertiesApi, unitTypesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UnitTypeForm } from '@/components/UnitTypeForm';
import { BuildingCountsForm } from '@/components/BuildingCountsForm';
import { FloorPlanViewer } from '@/components/FloorPlanViewer';
import {
  ArrowLeft,
  Plus,
  Edit,
  Building2,
  Home,
  FileText,
  Layers,
  Trash2,
} from 'lucide-react';

export default function UnitTypesPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = params.id as string;

  const [addTypeOpen, setAddTypeOpen] = useState(false);
  const [editType, setEditType] = useState<any>(null);
  const [buildingCountsType, setBuildingCountsType] = useState<any>(null);
  const [floorPlanViewer, setFloorPlanViewer] = useState<{
    url: string;
    name: string;
  } | null>(null);

  // Fetch project → get propertyId
  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await projectsApi.getById(parseInt(projectId));
      return res.data.project;
    },
  });

  // Fetch property → get buildings
  const { data: propertyData } = useQuery({
    queryKey: ['property', projectData?.propertyId],
    queryFn: async () => {
      if (!projectData?.propertyId) return null;
      const res = await propertiesApi.getById(projectData.propertyId);
      return res.data.property;
    },
    enabled: !!projectData?.propertyId,
  });

  // Fetch unit types
  const { data: unitTypesData, isLoading } = useQuery({
    queryKey: ['unitTypes', projectData?.propertyId],
    queryFn: async () => {
      if (!projectData?.propertyId) return [];
      const res = await unitTypesApi.getAll(projectData.propertyId);
      return res.data.unitTypes;
    },
    enabled: !!projectData?.propertyId,
  });

  const unitTypes = unitTypesData || [];
  const buildings = propertyData?.buildings || [];

  // Total units across all types
  const grandTotal = unitTypes.reduce((sum: number, type: any) => {
    const typeTotal =
      type.buildingCounts?.reduce((s: number, bc: any) => s + bc.count, 0) || 0;
    return sum + typeTotal;
  }, 0);

  const getStatusColor = (finishes: any) => {
    if (!finishes || !Object.values(finishes).some(Boolean))
      return 'border-gray-200';
    return 'border-blue-200';
  };

  return (
    <div className='p-4 md:p-8 space-y-4 md:space-y-6'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='icon'
            className='shrink-0'
            onClick={() =>
              router.push(`/dashboard/projects/${projectId}/property`)
            }>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Unit Types</h1>
            <p className='text-muted-foreground text-sm mt-0.5'>
              {propertyData?.propName}
            </p>
          </div>
        </div>
        <Button onClick={() => setAddTypeOpen(true)} className='w-full sm:w-auto'>
          <Plus className='h-4 w-4 mr-2' />
          Add Unit Type
        </Button>
      </div>

      {/* Add/Edit Form */}
      <UnitTypeForm
        open={addTypeOpen}
        onOpenChange={setAddTypeOpen}
        propertyId={projectData?.propertyId || 0}
      />

      {editType && (
        <UnitTypeForm
          open={!!editType}
          onOpenChange={(open) => !open && setEditType(null)}
          propertyId={projectData?.propertyId || 0}
          existingType={editType}
        />
      )}

      {/* Building Counts Form */}
      {buildingCountsType && (
        <BuildingCountsForm
          open={!!buildingCountsType}
          onOpenChange={(open) => !open && setBuildingCountsType(null)}
          unitType={buildingCountsType}
          buildings={buildings}
          propertyId={projectData?.propertyId || 0}
        />
      )}

      {/* Floor Plan Viewer */}
      {floorPlanViewer && (
        <FloorPlanViewer
          open={!!floorPlanViewer}
          onOpenChange={(open) => !open && setFloorPlanViewer(null)}
          floorPlanUrl={floorPlanViewer.url}
          unitTypeName={floorPlanViewer.name}
        />
      )}

      {/* Summary Stats — compact always-3-col */}
      {unitTypes.length > 0 && (
        <div className='grid grid-cols-3 gap-2 md:gap-4'>
          <Card>
            <CardContent className='p-3 md:p-5'>
              <div className='flex items-start gap-2 md:gap-3'>
                <div className='p-2 bg-blue-100 rounded-lg shrink-0'>
                  <Layers className='h-4 w-4 md:h-5 md:w-5 text-blue-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground leading-tight'>Types</p>
                  <p className='font-bold text-sm md:text-lg mt-0.5'>{unitTypes.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-3 md:p-5'>
              <div className='flex items-start gap-2 md:gap-3'>
                <div className='p-2 bg-green-100 rounded-lg shrink-0'>
                  <Home className='h-4 w-4 md:h-5 md:w-5 text-green-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground leading-tight'>Total Units</p>
                  <p className='font-bold text-sm md:text-lg mt-0.5'>{grandTotal}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className='p-3 md:p-5'>
              <div className='flex items-start gap-2 md:gap-3'>
                <div className='p-2 bg-purple-100 rounded-lg shrink-0'>
                  <Building2 className='h-4 w-4 md:h-5 md:w-5 text-purple-600' />
                </div>
                <div className='min-w-0'>
                  <p className='text-xs text-muted-foreground leading-tight'>Buildings</p>
                  <p className='font-bold text-sm md:text-lg mt-0.5'>{buildings.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Unit Types List */}
      {isLoading ? (
        <div className='flex items-center justify-center min-h-[300px]'>
          <div className='text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
            <p className='mt-4 text-sm text-gray-500'>Loading unit types...</p>
          </div>
        </div>
      ) : unitTypes.length === 0 ? (
        <Card>
          <CardContent className='py-16 text-center'>
            <Home className='h-16 w-16 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-700 mb-2'>
              No Unit Types Yet
            </h3>
            <p className='text-muted-foreground mb-6 max-w-md mx-auto'>
              Define standard unit layouts like "2bed/2bath" or "1bed/1bath"
              with finishes, amenities, and floor plans. Then set how many are
              in each building.
            </p>
            <Button onClick={() => setAddTypeOpen(true)}>
              <Plus className='h-4 w-4 mr-2' />
              Add First Unit Type
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className='space-y-4'>
          {unitTypes.map((type: any) => {
            const totalCount =
              type.buildingCounts?.reduce(
                (sum: number, bc: any) => sum + bc.count,
                0,
              ) || 0;

            return (
              <Card
                key={type.id}
                className={`border-2 ${getStatusColor(type.finishes)}`}>
                <CardContent className='p-6'>
                  <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
                    {/* Left: Basic Info */}
                    <div className='lg:col-span-1'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='text-xl font-bold'>{type.typeName}</h3>
                          <p className='text-muted-foreground text-sm mt-1'>
                            {type.bedrooms} bed · {type.bathrooms} bath
                            {type.squareFootage &&
                              ` · ${type.squareFootage.toLocaleString()} sq ft`}
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-3xl font-bold text-primary'>
                            {totalCount}
                          </p>
                          <p className='text-xs text-muted-foreground'>
                            total units
                          </p>
                        </div>
                      </div>

                      {/* Floor Plan Link */}
                      {type.floorPlanUrl ? (
                        <button
                          onClick={() =>
                            setFloorPlanViewer({
                              url: type.floorPlanUrl,
                              name: type.typeName,
                            })
                          }
                          className='flex items-center gap-1 text-sm text-blue-600 hover:underline mt-3'>
                          <FileText className='h-3.5 w-3.5' />
                          View Floor Plan
                        </button>
                      ) : (
                        <p className='text-xs text-muted-foreground mt-3 italic'>
                          No floor plan uploaded
                        </p>
                      )}

                      {type.notes && (
                        <p className='text-sm text-muted-foreground mt-2 italic'>
                          {type.notes}
                        </p>
                      )}
                    </div>

                    {/* Middle: Finishes & Amenities */}
                    <div className='lg:col-span-2 grid grid-cols-2 gap-4'>
                      {/* Finishes */}
                      <div>
                        <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
                          Standard Finishes
                        </h4>
                        {type.finishes &&
                        Object.entries(type.finishes).some(([, v]) => v) ? (
                          <div className='space-y-1'>
                            {Object.entries(type.finishes).map(
                              ([key, value]) =>
                                value ? (
                                  <div key={key} className='flex gap-2 text-sm'>
                                    <span className='text-muted-foreground capitalize min-w-[80px]'>
                                      {key}:
                                    </span>
                                    <span className='font-medium'>
                                      {value as string}
                                    </span>
                                  </div>
                                ) : null,
                            )}
                          </div>
                        ) : (
                          <p className='text-sm text-muted-foreground italic'>
                            Not specified
                          </p>
                        )}
                      </div>

                      {/* Amenities */}
                      <div>
                        <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
                          Amenities
                        </h4>
                        {type.amenities &&
                        Object.entries(type.amenities).some(([, v]) => v) ? (
                          <div className='space-y-1'>
                            {type.amenities.washer_dryer && (
                              <div className='flex gap-2 text-sm'>
                                <span className='text-muted-foreground min-w-[80px]'>
                                  W/D:
                                </span>
                                <span className='font-medium capitalize'>
                                  {type.amenities.washer_dryer}
                                </span>
                              </div>
                            )}
                            {type.amenities.parking && (
                              <div className='flex gap-2 text-sm'>
                                <span className='text-muted-foreground min-w-[80px]'>
                                  Parking:
                                </span>
                                <span className='font-medium capitalize'>
                                  {type.amenities.parking}
                                </span>
                              </div>
                            )}
                            {type.amenities.balcony && (
                              <div className='flex gap-2 text-sm'>
                                <span className='text-muted-foreground min-w-[80px]'>
                                  Balcony:
                                </span>
                                <span className='font-medium'>Yes</span>
                              </div>
                            )}
                            {type.amenities.dishwasher && (
                              <div className='flex gap-2 text-sm'>
                                <span className='text-muted-foreground min-w-[80px]'>
                                  Dishwasher:
                                </span>
                                <span className='font-medium'>Yes</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className='text-sm text-muted-foreground italic'>
                            Not specified
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Building Breakdown + Actions */}
                    <div className='lg:col-span-1'>
                      <h4 className='text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2'>
                        Building Distribution
                      </h4>

                      {type.buildingCounts && type.buildingCounts.length > 0 ? (
                        <div className='space-y-2 mb-4'>
                          {buildings.map((building: any) => {
                            const bc = type.buildingCounts?.find(
                              (b: any) => b.buildingId === building.id,
                            );
                            const count = bc?.count || 0;
                            return (
                              <div
                                key={building.id}
                                className='flex items-center justify-between text-sm'>
                                <div className='flex items-center gap-2'>
                                  <Building2 className='h-3.5 w-3.5 text-muted-foreground' />
                                  <span className='text-muted-foreground'>
                                    Building {building.buildingNumber}
                                  </span>
                                </div>
                                <span
                                  className={`font-semibold ${count > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {count}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className='text-sm text-muted-foreground italic mb-4'>
                          No counts set yet
                        </p>
                      )}

                      <div className='flex flex-col gap-2'>
                        <Button
                          size='sm'
                          variant='outline'
                          className='w-full'
                          onClick={() => setBuildingCountsType(type)}>
                          <Building2 className='h-3.5 w-3.5 mr-2' />
                          Set Counts
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          className='w-full'
                          onClick={() => setEditType(type)}>
                          <Edit className='h-3.5 w-3.5 mr-2' />
                          Edit Type
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
