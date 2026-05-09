'use client';

import { useQuery } from '@tanstack/react-query';
import { residentsApi, unitTypesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Home, Bed, Bath, Square, FileText, CheckCircle,
  Loader2, AlertCircle, Paintbrush, Sofa,
} from 'lucide-react';

interface Finishes {
  flooring?: string;
  countertops?: string;
  appliances?: string;
  cabinets?: string;
  fixtures?: string;
  [key: string]: string | undefined;
}

interface Amenities {
  balcony?: boolean;
  washer_dryer?: string;
  parking?: string;
  storage?: string;
  dishwasher?: boolean;
  [key: string]: boolean | string | undefined;
}

const FINISH_LABELS: Record<string, string> = {
  flooring: 'Flooring',
  countertops: 'Countertops',
  appliances: 'Appliances',
  cabinets: 'Cabinets',
  fixtures: 'Fixtures',
};

const AMENITY_ICONS: Record<string, string> = {
  balcony: '🌿',
  washer_dryer: '🧺',
  parking: '🚗',
  storage: '📦',
  dishwasher: '🍽️',
};

function formatAmenityValue(val: boolean | string | undefined): string {
  if (val === true) return 'Yes';
  if (val === false || val === undefined) return '';
  return String(val).replace(/_/g, ' ');
}

export default function ResidentUnitPage() {
  const { data: meData, isLoading: loadingMe } = useQuery({
    queryKey: ['residentMe'],
    queryFn: async () => (await residentsApi.getMe()).data,
  });

  const unit = meData?.unit;
  const unitTypeId = unit?.unitTypeId;

  const { data: unitTypeData, isLoading: loadingType } = useQuery({
    queryKey: ['unitType', unitTypeId],
    queryFn: async () => (await unitTypesApi.getById(unitTypeId!)).data.unitType,
    enabled: !!unitTypeId,
  });

  const unitType = unitTypeData;

  if (loadingMe) {
    return (
      <div className='flex justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className='p-6 text-center py-20'>
        <AlertCircle className='h-12 w-12 text-gray-300 mx-auto mb-3' />
        <p className='text-gray-600 font-medium'>No unit information found</p>
        <p className='text-sm text-muted-foreground mt-1'>Contact your property manager for details</p>
      </div>
    );
  }

  const finishes: Finishes = unitType?.finishes || {};
  const amenities: Amenities = unitType?.amenities || {};
  const activeAmenities = Object.entries(amenities).filter(([_, v]) => v !== undefined && v !== false);

  return (
    <div className='p-4 space-y-4'>
      {/* Hero card */}
      <Card className='border-0 shadow-md overflow-hidden'>
        <div className='h-2 bg-gradient-to-r from-blue-500 to-indigo-600' />
        <CardContent className='p-5'>
          <div className='flex items-start gap-4'>
            <div className='p-3 bg-blue-100 rounded-xl shrink-0'>
              <Home className='h-7 w-7 text-blue-600' />
            </div>
            <div>
              <p className='text-xs text-muted-foreground uppercase tracking-wide font-medium'>Your Unit</p>
              <h1 className='text-2xl font-bold text-gray-900'>
                {unit.unitNumber ? `Unit ${unit.unitNumber}` : 'All Units'}
              </h1>
              {unit.property?.propName && (
                <p className='text-sm text-muted-foreground mt-0.5'>{unit.property.propName}</p>
              )}
              {unit.property?.propAddress && (
                <p className='text-xs text-muted-foreground'>{unit.property.propAddress}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Unit specs */}
      {unitType && (
        <Card>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-base'>Unit Specifications</CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='grid grid-cols-3 gap-3'>
              {unitType.bedrooms != null && (
                <div className='flex flex-col items-center text-center bg-gray-50 rounded-xl p-3'>
                  <Bed className='h-5 w-5 text-blue-500 mb-1' />
                  <span className='text-xl font-bold text-gray-900'>{unitType.bedrooms}</span>
                  <span className='text-xs text-muted-foreground'>
                    {unitType.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                  </span>
                </div>
              )}
              {unitType.bathrooms != null && (
                <div className='flex flex-col items-center text-center bg-gray-50 rounded-xl p-3'>
                  <Bath className='h-5 w-5 text-indigo-500 mb-1' />
                  <span className='text-xl font-bold text-gray-900'>{unitType.bathrooms}</span>
                  <span className='text-xs text-muted-foreground'>
                    {unitType.bathrooms === 1 ? 'Bathroom' : 'Bathrooms'}
                  </span>
                </div>
              )}
              {unitType.squareFootage && (
                <div className='flex flex-col items-center text-center bg-gray-50 rounded-xl p-3'>
                  <Square className='h-5 w-5 text-green-500 mb-1' />
                  <span className='text-xl font-bold text-gray-900'>{unitType.squareFootage}</span>
                  <span className='text-xs text-muted-foreground'>Sq Ft</span>
                </div>
              )}
            </div>
            {unitType.typeName && (
              <p className='text-xs text-center text-muted-foreground mt-3'>
                Unit Type: <span className='font-medium'>{unitType.typeName}</span>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Finishes */}
      {Object.keys(finishes).length > 0 && (
        <Card>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-base flex items-center gap-2'>
              <Paintbrush className='h-4 w-4' /> Finishes & Materials
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='space-y-2.5'>
              {Object.entries(finishes).map(([key, val]) => {
                if (!val) return null;
                return (
                  <div key={key} className='flex items-center justify-between text-sm'>
                    <span className='text-muted-foreground'>{FINISH_LABELS[key] || key}</span>
                    <span className='font-medium text-gray-900 text-right'>{val}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amenities */}
      {activeAmenities.length > 0 && (
        <Card>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-base flex items-center gap-2'>
              <Sofa className='h-4 w-4' /> Amenities
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='grid grid-cols-2 gap-2'>
              {activeAmenities.map(([key, val]) => (
                <div key={key} className='flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2.5'>
                  <span className='text-lg shrink-0'>{AMENITY_ICONS[key] || '✓'}</span>
                  <div>
                    <p className='text-xs font-medium text-gray-900 capitalize'>
                      {key.replace(/_/g, ' ')}
                    </p>
                    {val !== true && (
                      <p className='text-xs text-muted-foreground capitalize'>{formatAmenityValue(val)}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Floor plan */}
      {unitType?.floorPlanUrl && (
        <Card>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-base flex items-center gap-2'>
              <FileText className='h-4 w-4' /> Floor Plan
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <a
              href={unitType.floorPlanUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='flex items-center gap-3 p-3 border border-blue-200 bg-blue-50 rounded-xl text-blue-700 hover:bg-blue-100 transition-colors'
            >
              <FileText className='h-5 w-5 shrink-0' />
              <div>
                <p className='text-sm font-medium'>View Floor Plan</p>
                <p className='text-xs text-blue-500'>Opens in a new tab</p>
              </div>
            </a>
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      {unitType?.notes && (
        <Card>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-base'>Notes</CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <p className='text-sm text-gray-700'>{unitType.notes}</p>
          </CardContent>
        </Card>
      )}

      {loadingType && (
        <div className='flex justify-center py-4'>
          <Loader2 className='h-5 w-5 animate-spin text-gray-400' />
        </div>
      )}
    </div>
  );
}
