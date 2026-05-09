'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, propertiesApi, unitTypesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FloorPlanViewer } from '@/components/FloorPlanViewer';
import { InviteResidentModal } from '@/components/InviteResidentModal';
import { CreateBulletinModal } from '@/components/CreateBulletinModal';
import {
  ArrowLeft,
  Building2,
  Home,
  MapPin,
  Layers,
  Grid3x3,
  Plus,
  FileText,
  UserPlus,
  Bell,
} from 'lucide-react';
import Link from 'next/link';

export default function PropertyDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.id as string;
  const [floorPlanViewer, setFloorPlanViewer] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [bulletinOpen, setBulletinOpen] = useState(false);

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const response = await projectsApi.getById(parseInt(projectId));
      return response.data.project;
    },
  });

  const { data: propertyData, isLoading } = useQuery({
    queryKey: ['property', projectData?.propertyId],
    queryFn: async () => {
      if (!projectData?.propertyId) return null;
      const response = await propertiesApi.getById(projectData.propertyId);
      return response.data.property;
    },
    enabled: !!projectData?.propertyId,
  });

  const { data: unitTypesData } = useQuery({
    queryKey: ['unitTypes', projectData?.propertyId],
    queryFn: async () => {
      if (!projectData?.propertyId) return null;
      const response = await unitTypesApi.getAll(projectData.propertyId);
      return response.data.unitTypes;
    },
    enabled: !!projectData?.propertyId,
  });

  if (isLoading) {
    return (
      <div className='p-8'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
            <p className='mt-4 text-sm text-gray-500'>Loading property...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!projectData?.propertyId) {
    return (
      <div className='p-8'>
        <div className='text-center py-12'>
          <Home className='h-16 w-16 text-gray-400 mx-auto mb-4' />
          <p className='text-gray-500 mb-4'>
            No property assigned to this project
          </p>
          <Button
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  if (!propertyData) {
    return (
      <div className='p-8'>
        <div className='text-center py-12'>
          <p className='text-gray-500'>Property not found</p>
          <Button
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}
            className='mt-4'>
            Back to Project
          </Button>
        </div>
      </div>
    );
  }

  const property = propertyData;
  const buildings = property.buildings || [];
  const unitTypes = unitTypesData || [];

  // Calculate totals from unit types
  const totalUnitsFromTypes = unitTypes.reduce((sum: number, type: any) => {
    const typeTotal =
      type.buildingCounts?.reduce((s: number, bc: any) => s + bc.count, 0) || 0;
    return sum + typeTotal;
  }, 0);

  return (
    <div className='p-4 md:p-8 space-y-4 md:space-y-6'>
      {/* Modals */}
      {floorPlanViewer && (
        <FloorPlanViewer
          open={!!floorPlanViewer}
          onOpenChange={(open) => !open && setFloorPlanViewer(null)}
          floorPlanUrl={floorPlanViewer.url}
          unitTypeName={floorPlanViewer.name}
        />
      )}
      <InviteResidentModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        projectId={parseInt(projectId)}
        propertyId={projectData?.propertyId || 0}
      />
      <CreateBulletinModal
        open={bulletinOpen}
        onOpenChange={setBulletinOpen}
        projectId={parseInt(projectId)}
        propertyId={projectData?.propertyId || 0}
      />
      {/* Header */}
      <div className='flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3'>
        <div className='flex items-start gap-3'>
          <Button
            variant='outline'
            size='icon'
            className='shrink-0 mt-0.5'
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div className='min-w-0'>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900 break-words'>
              {property.propName}
            </h1>
            <div className='flex items-start gap-1.5 mt-1 text-muted-foreground'>
              <MapPin className='h-4 w-4 shrink-0 mt-0.5' />
              <p className='text-sm'>
                {property.propAddress}
                {property.propCity && `, ${property.propCity}`}
                {property.propState && `, ${property.propState}`}
                {property.propZip && ` ${property.propZip}`}
              </p>
            </div>
          </div>
        </div>
        <div className='flex flex-col sm:flex-row gap-2 w-full sm:w-auto'>
          <Button
            variant='outline'
            className='w-full sm:w-auto shrink-0'
            onClick={() => setInviteOpen(true)}>
            <UserPlus className='h-4 w-4 mr-2' />
            Invite Resident
          </Button>
          <Button
            variant='outline'
            className='w-full sm:w-auto shrink-0'
            onClick={() => setBulletinOpen(true)}>
            <Bell className='h-4 w-4 mr-2' />
            Post Bulletin
          </Button>
          <Button
            className='w-full sm:w-auto shrink-0'
            onClick={() => router.push(`/dashboard/projects/${projectId}/walks`)}>
            <Building2 className='h-4 w-4 mr-2' />
            View Walks
          </Button>
        </div>
      </div>

      {/* Property Stats */}
      <div className='grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6'>
        {/* Mobile: icon → value → label, centered
            Desktop: icon left, label + value right */}
        <Card>
          <CardContent className='p-3 md:p-6'>
            <div className='flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:gap-3'>
              <div className='p-2 md:p-3 bg-blue-100 rounded-lg mb-2 md:mb-0 shrink-0'>
                <Building2 className='h-4 w-4 md:h-6 md:w-6 text-blue-600' />
              </div>
              <div>
                <p className='text-2xl font-bold leading-none'>
                  {property.totalBuildings || buildings.length}
                </p>
                <p className='text-xs text-muted-foreground mt-0.5'>Buildings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-3 md:p-6'>
            <div className='flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:gap-3'>
              <div className='p-2 md:p-3 bg-green-100 rounded-lg mb-2 md:mb-0 shrink-0'>
                <Home className='h-4 w-4 md:h-6 md:w-6 text-green-600' />
              </div>
              <div>
                <p className='text-2xl font-bold leading-none'>{totalUnitsFromTypes}</p>
                <p className='text-xs text-muted-foreground mt-0.5'>Total Units</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-3 md:p-6'>
            <div className='flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:gap-3'>
              <div className='p-2 md:p-3 bg-purple-100 rounded-lg mb-2 md:mb-0 shrink-0'>
                <Grid3x3 className='h-4 w-4 md:h-6 md:w-6 text-purple-600' />
              </div>
              <div>
                <p className='text-2xl font-bold leading-none'>{unitTypes.length}</p>
                <p className='text-xs text-muted-foreground mt-0.5'>Unit Types</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className='p-3 md:p-6'>
            <div className='flex flex-col items-center text-center md:flex-row md:items-center md:text-left md:gap-3'>
              <div className='p-2 md:p-3 bg-yellow-100 rounded-lg mb-2 md:mb-0 shrink-0'>
                <Layers className='h-4 w-4 md:h-6 md:w-6 text-yellow-600' />
              </div>
              <div>
                <p className='text-sm font-bold capitalize leading-tight'>
                  {property.propType?.replace('_', ' ') || 'N/A'}
                </p>
                <p className='text-xs text-muted-foreground mt-0.5'>Prop. Type</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unit Types */}
      <Card>
        <CardHeader className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3'>
          <CardTitle>Unit Types</CardTitle>
          <Link href={`/dashboard/projects/${projectId}/property/unit-types`}>
            <Button className='w-full sm:w-auto'>
              <Plus className='h-4 w-4 mr-2' />
              Manage Unit Types
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {unitTypes.length === 0 ? (
            <div className='text-center py-8'>
              <FileText className='h-12 w-12 text-gray-400 mx-auto mb-3' />
              <p className='text-gray-500 mb-4'>No unit types defined yet</p>
              <Link
                href={`/dashboard/projects/${projectId}/property/unit-types`}>
                <Button>
                  <Plus className='h-4 w-4 mr-2' />
                  Add First Unit Type
                </Button>
              </Link>
            </div>
          ) : (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {unitTypes.map((type: any) => {
                const totalCount =
                  type.buildingCounts?.reduce(
                    (sum: number, bc: any) => sum + bc.count,
                    0,
                  ) || 0;
                return (
                  <Card key={type.id} className='border-2'>
                    <CardContent className='p-4'>
                      <div className='flex items-start justify-between mb-3'>
                        <div>
                          <h3 className='font-semibold text-lg'>
                            {type.typeName}
                          </h3>
                          <p className='text-sm text-muted-foreground'>
                            {type.bedrooms} bed / {type.bathrooms} bath
                          </p>
                        </div>
                        <div className='text-right'>
                          <p className='text-2xl font-bold text-primary'>
                            {totalCount}
                          </p>
                          <p className='text-xs text-muted-foreground'>units</p>
                        </div>
                      </div>
                      {type.squareFootage && (
                        <p className='text-sm text-muted-foreground'>
                          {type.squareFootage.toLocaleString()} sq ft
                        </p>
                      )}
                      {type.floorPlanUrl && (
                        <div className='mt-2'>
                          <button
                            onClick={() =>
                              setFloorPlanViewer({
                                url: type.floorPlanUrl,
                                name: type.typeName,
                              })
                            }
                            className='text-xs text-blue-600 hover:underline'>
                            View Floor Plan
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buildings Grid */}
      <div>
        <h2 className='text-xl md:text-2xl font-bold mb-3 md:mb-4'>Buildings</h2>
        {buildings.length === 0 ? (
          <Card>
            <CardContent className='py-12 text-center'>
              <Building2 className='h-16 w-16 text-gray-400 mx-auto mb-4' />
              <p className='text-gray-500'>No buildings added yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {buildings.map((building: any) => {
              // Get unit counts for this building
              const buildingUnitCounts = unitTypes.flatMap(
                (type: any) =>
                  type.buildingCounts?.filter(
                    (bc: any) => bc.buildingId === building.id,
                  ) || [],
              );
              const totalUnitsInBuilding = buildingUnitCounts.reduce(
                (sum: number, bc: any) => sum + bc.count,
                0,
              );

              return (
                <Card
                  key={building.id}
                  className='hover:shadow-lg transition-shadow'>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div>
                        <CardTitle className='text-lg'>
                          Building {building.buildingNumber}
                        </CardTitle>
                        {building.buildingName && (
                          <p className='text-sm text-muted-foreground mt-1'>
                            {building.buildingName}
                          </p>
                        )}
                      </div>
                      <div className='p-2 bg-blue-100 rounded-lg'>
                        <Building2 className='h-5 w-5 text-blue-600' />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-3'>
                      <div className='flex justify-between text-sm'>
                        <span className='text-muted-foreground'>
                          Total Units
                        </span>
                        <span className='font-semibold'>
                          {totalUnitsInBuilding}
                        </span>
                      </div>
                      {building.floors && (
                        <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>Floors</span>
                          <span className='font-semibold'>
                            {building.floors}
                          </span>
                        </div>
                      )}
                      {building.squareFootage && (
                        <div className='flex justify-between text-sm'>
                          <span className='text-muted-foreground'>Sq. Ft.</span>
                          <span className='font-semibold'>
                            {parseFloat(
                              building.squareFootage,
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}

                      {/* Unit Type Breakdown */}
                      {buildingUnitCounts.length > 0 && (
                        <div className='pt-3 border-t'>
                          <p className='text-xs text-muted-foreground mb-2'>
                            Unit Mix:
                          </p>
                          <div className='space-y-1'>
                            {buildingUnitCounts.map((bc: any) => {
                              const unitType = unitTypes.find(
                                (t: any) => t.id === bc.unitTypeId,
                              );
                              return (
                                <div
                                  key={bc.id}
                                  className='flex justify-between text-sm'>
                                  <span className='text-muted-foreground'>
                                    {unitType?.typeName}
                                  </span>
                                  <span className='font-medium'>
                                    {bc.count}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
