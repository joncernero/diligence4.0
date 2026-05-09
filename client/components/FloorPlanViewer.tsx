'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Download, ExternalLink } from 'lucide-react';

interface FloorPlanViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  floorPlanUrl: string;
  unitTypeName: string;
}

export function FloorPlanViewer({
  open,
  onOpenChange,
  floorPlanUrl,
  unitTypeName,
}: FloorPlanViewerProps) {
  const isPDF = floorPlanUrl.toLowerCase().endsWith('.pdf');
  const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(floorPlanUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-5xl max-h-[90vh] p-0'>
        <DialogHeader className='p-6 pb-0'>
          <div className='flex items-center justify-between'>
            <DialogTitle>Floor Plan — {unitTypeName}</DialogTitle>
            <div className='flex items-center gap-2'>
              <a href={floorPlanUrl} download>
                <Button variant='outline' size='sm'>
                  <Download className='h-4 w-4 mr-2' />
                  Download
                </Button>
              </a>
              <a href={floorPlanUrl} target='_blank' rel='noopener noreferrer'>
                <Button variant='outline' size='sm'>
                  <ExternalLink className='h-4 w-4 mr-2' />
                  Open in New Tab
                </Button>
              </a>
            </div>
          </div>
        </DialogHeader>

        <div className='p-6 pt-4 overflow-auto max-h-[calc(90vh-100px)]'>
          {isPDF ? (
            <iframe
              src={floorPlanUrl}
              className='w-full h-[70vh] border rounded'
              title={`${unitTypeName} Floor Plan`}
            />
          ) : isImage ? (
            <img
              src={floorPlanUrl}
              alt={`${unitTypeName} Floor Plan`}
              className='w-full h-auto rounded border'
            />
          ) : (
            <div className='text-center py-12'>
              <p className='text-muted-foreground mb-4'>
                Unable to preview this file type
              </p>
              <a href={floorPlanUrl} download>
                <Button>
                  <Download className='h-4 w-4 mr-2' />
                  Download File
                </Button>
              </a>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
