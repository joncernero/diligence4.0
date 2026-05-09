'use client';

import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Upload, X, Camera } from 'lucide-react';

interface PhotoUploadProps {
  observationId: number;
  walkId: number;
}

export function PhotoUpload({ observationId, walkId }: PhotoUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [caption, setCaption] = useState('');
  const [error, setError] = useState('');

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post(`/observations/${observationId}/photos`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walk', walkId] });
      queryClient.invalidateQueries({ queryKey: ['observation', observationId] });
      resetForm();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to upload photo');
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError('');

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = () => {
    if (!selectedFile) {
      setError('Please select a photo');
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);
    if (caption) {
      formData.append('caption', caption);
    }
    formData.append('photoType', 'before');

    uploadMutation.mutate(formData);
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreview('');
    setCaption('');
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="space-y-2">
        <Label>Upload Photo</Label>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Buttons */}
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose File
          </Button>
          <Button
            type="button"
            variant="outline"
            className="flex-1 md:hidden"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          {selectedFile && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={resetForm}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {selectedFile && (
          <p className="text-xs text-muted-foreground truncate">{selectedFile.name}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Supported: JPG, PNG, WEBP (Max 10MB)
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="border rounded-lg p-4">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto max-h-64 rounded mx-auto"
          />
        </div>
      )}

      {/* Caption */}
      {selectedFile && (
        <div className="space-y-2">
          <Label htmlFor="caption">Caption (Optional)</Label>
          <Input
            id="caption"
            placeholder="Describe this photo..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Upload Button */}
      {selectedFile && (
        <Button
          onClick={handleUpload}
          disabled={uploadMutation.isPending}
          className="w-full"
        >
          <Upload className="h-4 w-4 mr-2" />
          {uploadMutation.isPending ? 'Uploading...' : 'Upload Photo'}
        </Button>
      )}
    </div>
  );
}
