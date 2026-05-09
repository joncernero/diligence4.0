'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { projectsApi, documentsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DocumentUpload } from '@/components/DocumentUpload';
import { DocumentViewer } from '@/components/DocumentViewer';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Download,
  Trash2,
  Eye,
  Grid3x3,
  List,
} from 'lucide-react';

export default function ProjectDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const projectId = parseInt(params.id as string);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: projectData } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await projectsApi.getById(projectId);
      return res.data.project;
    },
  });

  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', projectId, categoryFilter],
    queryFn: async () => {
      const params: any = { projectId };
      if (categoryFilter !== 'all') params.categoryId = categoryFilter;
      const res = await documentsApi.getAll(params);
      return res.data.documents;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['documentCategories'],
    queryFn: async () => {
      const res = await documentsApi.getCategories();
      return res.data.categories;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const documents = documentsData || [];
  const categories = categoriesData || [];

  const filteredDocs = documents.filter((doc: any) =>
    search
      ? doc.documentName.toLowerCase().includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase())
      : true
  );

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete document "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName?.split('.').pop()?.toLowerCase();
    const colors: Record<string, string> = {
      pdf: 'text-red-500',
      doc: 'text-blue-600',
      docx: 'text-blue-600',
      xls: 'text-green-600',
      xlsx: 'text-green-600',
      png: 'text-purple-500',
      jpg: 'text-purple-500',
      jpeg: 'text-purple-500',
    };
    return colors[ext || ''] || 'text-gray-500';
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
            onClick={() => router.push(`/dashboard/projects/${projectId}`)}>
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-2xl md:text-3xl font-bold text-gray-900'>Documents</h1>
            <p className='text-muted-foreground text-sm mt-0.5'>{projectData?.projectName}</p>
          </div>
        </div>
        <Button onClick={() => setUploadOpen(true)} className='w-full sm:w-auto'>
          <Plus className='h-4 w-4 mr-2' />
          Upload Document
        </Button>
      </div>

      {/* Upload Modal */}
      <DocumentUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        projectId={projectId}
      />

      {/* Viewer Modal */}
      {selectedDoc && (
        <DocumentViewer
          open={!!selectedDoc}
          onOpenChange={(open) => !open && setSelectedDoc(null)}
          document={selectedDoc}
        />
      )}

      {/* Filters */}
      <Card>
        <CardContent className='p-3 md:p-4'>
          {/* Search — full width on its own row */}
          <div className='relative mb-3'>
            <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search documents...'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='pl-10'
            />
          </div>
          {/* Category + view toggle on same row */}
          <div className='flex items-center gap-2'>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className='flex-1'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Categories</SelectItem>
                {categories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.categoryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className='flex items-center gap-1 shrink-0'>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size='icon'
                onClick={() => setViewMode('grid')}>
                <Grid3x3 className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size='icon'
                onClick={() => setViewMode('list')}>
                <List className='h-4 w-4' />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Count */}
      {!isLoading && filteredDocs.length > 0 && (
        <p className='text-sm text-muted-foreground px-1'>
          {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
        </p>
      )}

      {/* Documents */}
      {isLoading ? (
        <div className='flex items-center justify-center min-h-[300px]'>
          <div className='text-center'>
            <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent' />
            <p className='mt-4 text-sm text-gray-500'>Loading documents...</p>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className='py-14 text-center'>
            <FileText className='h-14 w-14 text-gray-300 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-700 mb-2'>
              {documents.length === 0 ? 'No Documents Yet' : 'No Results'}
            </h3>
            <p className='text-muted-foreground mb-6 text-sm'>
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {documents.length === 0 && (
              <Button onClick={() => setUploadOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Upload Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'>
          {filteredDocs.map((doc: any) => (
            <Card key={doc.id} className='hover:shadow-md transition-shadow active:scale-[0.98]'>
              <CardContent className='p-4'>
                <div className='flex items-start justify-between mb-3'>
                  <FileText className={`h-8 w-8 ${getFileIcon(doc.fileName)}`} />
                  <span className='text-xs text-muted-foreground bg-gray-100 px-1.5 py-0.5 rounded'>
                    v{doc.version}
                  </span>
                </div>
                <h3 className='font-semibold text-sm mb-1 line-clamp-2 leading-tight'>
                  {doc.documentName}
                </h3>
                <p className='text-xs text-muted-foreground mb-2 truncate'>{doc.fileName}</p>
                {doc.category && (
                  <span className='inline-block text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded mb-2'>
                    {doc.category.categoryName}
                  </span>
                )}
                <p className='text-xs text-muted-foreground mb-3'>
                  {formatFileSize(doc.fileSize)}
                </p>
                <div className='flex gap-1.5'>
                  <Button
                    size='sm'
                    variant='outline'
                    className='flex-1 h-8 text-xs'
                    onClick={() => setSelectedDoc(doc)}>
                    <Eye className='h-3 w-3 mr-1' />
                    View
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    className='h-8 w-8 p-0'
                    onClick={() => handleDelete(doc.id, doc.documentName)}>
                    <Trash2 className='h-3 w-3 text-destructive' />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className='p-0'>
            <div className='divide-y'>
              {filteredDocs.map((doc: any) => (
                <div
                  key={doc.id}
                  className='p-3 md:p-4 hover:bg-gray-50 transition-colors active:bg-gray-100'>
                  <div className='flex items-center gap-3'>
                    <div className='shrink-0 p-2 bg-gray-100 rounded-lg'>
                      <FileText className={`h-5 w-5 ${getFileIcon(doc.fileName)}`} />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <h3 className='font-semibold text-sm truncate'>{doc.documentName}</h3>
                      <p className='text-xs text-muted-foreground truncate'>
                        {formatFileSize(doc.fileSize)} • v{doc.version}
                        {doc.category ? ` • ${doc.category.categoryName}` : ''}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                    </div>
                    {/* Actions */}
                    <div className='flex items-center gap-1 shrink-0'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-8 w-8 p-0'
                        onClick={() => setSelectedDoc(doc)}>
                        <Eye className='h-4 w-4' />
                      </Button>
                      <a href={doc.fileUrl} download>
                        <Button size='sm' variant='outline' className='h-8 w-8 p-0'>
                          <Download className='h-4 w-4' />
                        </Button>
                      </a>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-8 w-8 p-0'
                        onClick={() => handleDelete(doc.id, doc.documentName)}>
                        <Trash2 className='h-4 w-4 text-destructive' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
