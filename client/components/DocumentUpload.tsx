'use client';

import { useState, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { documentsApi, projectsApi } from '@/lib/api';
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
import { Upload, FileText, X } from 'lucide-react';

interface DocumentUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId?: number;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ open, onOpenChange, projectId, onUploadComplete }: DocumentUploadProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    projectId: projectId?.toString() || '',
    categoryId: '',
    documentName: '',
    description: '',
    tags: '',
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await projectsApi.getAll();
      return res.data.projects;
    },
  });

  // Fetch categories
  const { data: categoriesData } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: async () => {
      const res = await documentsApi.getCategories();
      return res.data.categories;
    },
  });

  const projects = projectsData || [];
  const categories = categoriesData || [];

  const uploadMutation = useMutation({
    mutationFn: (data: FormData) => documentsApi.upload(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      onOpenChange(false);
      resetForm();
      if (onUploadComplete) onUploadComplete();
    },
    onError: (err: any) => {
      setError(err.response?.data?.error || 'Failed to upload document');
    },
  });

  const resetForm = () => {
    setFormData({
      projectId: projectId?.toString() || '',
      categoryId: '',
      documentName: '',
      description: '',
      tags: '',
    });
    setSelectedFile(null);
    setError('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      setSelectedFile(file);
      // Auto-fill document name if empty
      if (!formData.documentName) {
        setFormData(prev => ({ ...prev, documentName: file.name }));
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    if (!formData.projectId || !formData.documentName) {
      setError('Project and document name are required');
      return;
    }

    const data = new FormData();
    data.append('file', selectedFile);
    data.append('projectId', formData.projectId);
    data.append('documentName', formData.documentName);
    if (formData.categoryId) data.append('categoryId', formData.categoryId);
    if (formData.description) data.append('description', formData.description);
    if (formData.tags) data.append('tags', JSON.stringify(formData.tags.split(',').map(t => t.trim())));

    uploadMutation.mutate(data);
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
          <DialogDescription>
            Upload a document and associate it with a project
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="space-y-2">
            <Label>
              File <span className="text-destructive">*</span>
            </Label>
            <div className="border-2 border-dashed rounded-lg p-6 text-center">
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="text-left flex-1">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, Word, Excel, Images (Max 50MB)
                  </p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
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
                Select File
              </Button>
            </div>
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="project">
              Project <span className="text-destructive">*</span>
            </Label>
            <Select
              value={formData.projectId}
              onValueChange={(value) => handleChange('projectId', value)}
              disabled={!!projectId}
            >
              <SelectTrigger id="project">
                <SelectValue placeholder="Select project..." />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project: any) => (
                  <SelectItem key={project.id} value={project.id.toString()}>
                    {project.projectName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="documentName">
              Document Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="documentName"
              placeholder="e.g., Site Plan Rev 3"
              value={formData.documentName}
              onChange={(e) => handleChange('documentName', e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => handleChange('categoryId', value)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                placeholder="e.g., electrical, phase1"
                value={formData.tags}
                onChange={(e) => handleChange('tags', e.target.value)}
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="Document description..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
            />
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
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={uploadMutation.isPending}>
              {uploadMutation.isPending ? 'Uploading...' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
