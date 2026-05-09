'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Image as ImageIcon } from 'lucide-react';

interface Photo {
  id: number;
  photoUrl: string;
  fileName: string;
  caption?: string;
  photoType: string;
  uploadedAt: string;
  uploader?: {
    userFirst: string;
    userLast: string;
  };
}

interface PhotoGalleryProps {
  photos: Photo[];
}

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  if (!photos || photos.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No photos uploaded yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {photos.map((photo) => (
        <Card key={photo.id} className="overflow-hidden">
          <div className="aspect-video bg-gray-100 relative">
            <img
              src={photo.photoUrl}
              alt={photo.fileName}
              className="object-cover w-full h-full"
            />
          </div>
          {photo.caption && (
            <CardContent className="p-3">
              <p className="text-sm text-gray-700">{photo.caption}</p>
              {photo.uploader && (
                <p className="text-xs text-muted-foreground mt-1">
                  By {photo.uploader.userFirst} {photo.uploader.userLast}
                </p>
              )}
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
