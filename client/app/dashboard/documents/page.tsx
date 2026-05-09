'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
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
  Plus,
  Search,
  FileText,
  Download,
  Trash2,
  Eye,
  Grid3x3,
  List,
  FolderOpen,
} from 'lucide-react';

export default function GlobalDocumentsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [projectFilter, setProjectFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Fetch all documents (no project filter initially)
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['documents', projectFilter, categoryFilter],
    queryFn: async () => {
      const params: any = {};
      if (projectFilter !== 'all') params.projectId = projectFilter;
      if (categoryFilter !== 'all') params.categoryId = categoryFilter;
      const res = await documentsApi.getAll(params);
      return res.data.documents;
    },
  });

  // Fetch projects for filter
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

  const deleteMutation = useMutation({
    mutationFn: (id: number) => documentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
  });

  const documents = documentsData || [];
  const projects = projectsData || [];
  const categories = categoriesData || [];

  // Filter by search
  const filteredDocs = documents.filter((doc: any) =>
    search
      ? doc.documentName.toLowerCase().includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase()) ||
        doc.project?.projectName.toLowerCase().includes(search.toLowerCase())
      : true
  );

  // Group by project
  const documentsByProject = filteredDocs.reduce((acc: any, doc: any) => {
    const projectName = doc.project?.projectName || 'Unknown Project';
    if (!acc[projectName]) acc[projectName] = [];
    acc[projectName].push(doc);
    return acc;
  }, {});

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Delete document "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Documents</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            All project documents in one place
          </p>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Upload Document
        </Button>
      </div>

      {/* Upload Modal */}
      <DocumentUpload
        open={uploadOpen}
        onOpenChange={setUploadOpen}
      />

      {/* Viewer Modal */}
      {selectedDoc && (
        <DocumentViewer
          open={!!selectedDoc}
          onOpenChange={(open) => !open && setSelectedDoc(null)}
          document={selectedDoc}
        />
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="text-2xl font-bold">{documents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projects</p>
                <p className="text-2xl font-bold">{Object.keys(documentsByProject).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Grid3x3 className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categories.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col gap-3">
            {/* Search — full width on all sizes */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search documents or projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {/* Selects + view toggle row */}
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="flex-1 min-w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project: any) => (
                    <SelectItem key={project.id} value={project.id.toString()}>
                      {project.projectName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="flex-1 min-w-[130px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat: any) => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.categoryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2 ml-auto">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid3x3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-sm text-gray-500">Loading documents...</p>
          </div>
        </div>
      ) : filteredDocs.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {documents.length === 0 ? 'No Documents Yet' : 'No Results'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {documents.length === 0
                ? 'Upload your first document to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {documents.length === 0 && (
              <Button onClick={() => setUploadOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Document
              </Button>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="space-y-6">
          {Object.entries(documentsByProject).map(([projectName, docs]: [string, any]) => (
            <div key={projectName}>
              <h2 className="text-xl font-bold mb-3 text-gray-700">{projectName}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {docs.map((doc: any) => (
                  <Card key={doc.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <FileText className="h-8 w-8 text-blue-600" />
                        <span className="text-xs text-muted-foreground">v{doc.version}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold mb-1 line-clamp-2">{doc.documentName}</h3>
                      <p className="text-sm text-muted-foreground mb-2">{doc.fileName}</p>
                      {doc.category && (
                        <span className="inline-block text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded mb-3">
                          {doc.category.categoryName}
                        </span>
                      )}
                      <p className="text-xs text-muted-foreground mb-3">
                        {formatFileSize(doc.fileSize)} • {new Date(doc.uploadedAt).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => setSelectedDoc(doc)}>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleDelete(doc.id, doc.documentName)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="divide-y">
              {filteredDocs.map((doc: any) => (
                <div key={doc.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <FileText className="h-10 w-10 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{doc.documentName}</h3>
                      <p className="text-sm text-muted-foreground">
                        {doc.project?.projectName} • {doc.fileName} • {formatFileSize(doc.fileSize)} • v{doc.version}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {doc.category && (
                          <span className="inline-block text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                            {doc.category.categoryName}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => setSelectedDoc(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <a href={doc.fileUrl} download>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4" />
                        </Button>
                      </a>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(doc.id, doc.documentName)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
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
