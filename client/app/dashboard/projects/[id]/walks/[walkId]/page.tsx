'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { walksApi, observationsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AddObservationForm } from '@/components/AddObservationForm';
import { PhotoUpload } from '@/components/PhotoUpload';
import { PhotoGallery } from '@/components/PhotoGallery';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Plus, Calendar, User, MapPin, AlertCircle, Image, Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export default function WalkDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const walkId = parseInt(params.walkId as string);
  const projectId = parseInt(params.id as string);
  const [addObservationOpen, setAddObservationOpen] = useState(false);
  const [expandedObs, setExpandedObs] = useState<number | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (format: 'csv' | 'excel' | 'pdf') => {
    setExporting(format);
    try {
      const res = await walksApi.export(walkId, format);
      const mimeMap: Record<string, string> = {
        csv: 'text/csv',
        excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        pdf: 'application/pdf',
      };
      const extMap: Record<string, string> = { csv: 'csv', excel: 'xlsx', pdf: 'pdf' };
      const blob = new Blob([res.data], { type: mimeMap[format] });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `walk-${walkId}-observations.${extMap[format]}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed', err);
    } finally {
      setExporting(null);
    }
  };

  const { data: walkData, isLoading } = useQuery({
    queryKey: ['walk', walkId],
    queryFn: async () => {
      const response = await walksApi.getById(walkId);
      return response.data.walk;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ obsId, status }: { obsId: number; status: string }) =>
      observationsApi.update(obsId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['walk', walkId] });
    },
  });

  if (isLoading) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-sm text-gray-500">Loading walk details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!walkData) {
    return (
      <div className="p-4 md:p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Walk not found</p>
          <Button onClick={() => router.push(`/dashboard/projects/${projectId}/walks`)} className="mt-4">
            Back to Walks
          </Button>
        </div>
      </div>
    );
  }

  const walk = walkData;
  const observations = walk.observations || [];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      open: 'bg-red-100 text-red-700',
      in_progress: 'bg-yellow-100 text-yellow-700',
      resolved: 'bg-green-100 text-green-700',
      verified: 'bg-blue-100 text-blue-700',
      closed: 'bg-gray-100 text-gray-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getSeverityColor = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'text-red-600',
      major: 'text-orange-600',
      minor: 'text-yellow-600',
      cosmetic: 'text-blue-600',
    };
    return colors[severity] || 'text-gray-600';
  };

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 mt-0.5"
            onClick={() => router.push(`/dashboard/projects/${projectId}/walks`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 capitalize">
              {walk.walkType.replace('_', ' ')} Walk
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              {new Date(walk.walkDate).toLocaleDateString()} at {new Date(walk.walkDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
        <div className="flex flex-col min-[400px]:flex-row gap-2 w-full sm:w-auto">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full min-[400px]:w-auto shrink-0" disabled={!!exporting}>
                <Download className="h-4 w-4 mr-2" />
                {exporting ? `Exporting…` : 'Export'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('csv')}>
                <FileText className="h-4 w-4 mr-2 text-gray-500" />
                Download CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('excel')}>
                <FileSpreadsheet className="h-4 w-4 mr-2 text-green-600" />
                Download Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('pdf')}>
                <File className="h-4 w-4 mr-2 text-red-500" />
                Download PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button className="w-full min-[400px]:w-auto shrink-0" onClick={() => setAddObservationOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Observation
          </Button>
        </div>
      </div>

      <AddObservationForm
        open={addObservationOpen}
        onOpenChange={setAddObservationOpen}
        walkId={walkId}
        projectId={projectId}
      />

      {/* Walk Info — compact always-3-col */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <Card>
          <CardContent className="p-3 md:p-5">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="p-2 bg-blue-100 rounded-lg shrink-0">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">Status</p>
                <p className="font-semibold text-sm mt-0.5 capitalize truncate">
                  {walk.walkStatus.replace('_', ' ')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-5">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="p-2 bg-green-100 rounded-lg shrink-0">
                <User className="h-4 w-4 md:h-5 md:w-5 text-green-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">Conducted By</p>
                <p className="font-semibold text-sm mt-0.5 truncate">
                  {walk.conductor
                    ? `${walk.conductor.userFirst} ${walk.conductor.userLast}`
                    : 'Not assigned'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-3 md:p-5">
            <div className="flex items-start gap-2 md:gap-3">
              <div className="p-2 bg-purple-100 rounded-lg shrink-0">
                <MapPin className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground leading-tight">Property</p>
                <p className="font-semibold text-sm mt-0.5 truncate">
                  {walk.property?.propName || 'N/A'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {walk.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Walk Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-700">{walk.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Observations */}
      <div>
        <div className="flex items-center justify-between mb-3 md:mb-4">
          <h2 className="text-xl md:text-2xl font-bold">Observations ({observations.length})</h2>
        </div>

        {observations.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No observations recorded yet</p>
              <Button onClick={() => setAddObservationOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add First Observation
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {observations.map((obs: any) => (
              <Card key={obs.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4 md:p-6">
                  <div className="space-y-3 md:space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base md:text-lg break-words">{obs.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{obs.description}</p>
                        {obs.location && (
                          <div className="flex items-center gap-2 mt-2">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">{obs.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status and Info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Status Dropdown */}
                      <Select
                        value={obs.status}
                        onValueChange={(value) => updateStatusMutation.mutate({ obsId: obs.id, status: value })}
                      >
                        <SelectTrigger className="w-full sm:w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>

                      {obs.severity && (
                        <span className={`text-sm font-medium capitalize ${getSeverityColor(obs.severity)}`}>
                          {obs.severity}
                        </span>
                      )}
                      {obs.category && (
                        <span className="text-sm text-muted-foreground capitalize">
                          {obs.category.replace('_', ' ')}
                        </span>
                      )}
                      {obs.tradeType && (
                        <span className="text-sm text-muted-foreground capitalize">
                          Trade: {obs.tradeType}
                        </span>
                      )}
                    </div>

                    {/* Photos */}
                    {obs.photos && obs.photos.length > 0 && (
                      <div className="pt-3 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setExpandedObs(expandedObs === obs.id ? null : obs.id)}
                        >
                          <Image className="h-4 w-4 mr-2" />
                          {obs.photos.length} Photo{obs.photos.length !== 1 ? 's' : ''}
                        </Button>
                        {expandedObs === obs.id && (
                          <div className="mt-3">
                            <PhotoGallery photos={obs.photos} />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photo Upload */}
                    {expandedObs === obs.id && (
                      <div className="pt-3 border-t">
                        <h4 className="font-medium mb-3">Add Photo</h4>
                        <PhotoUpload observationId={obs.id} walkId={walkId} />
                      </div>
                    )}

                    {/* Expand/Collapse Button */}
                    {expandedObs !== obs.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedObs(obs.id)}
                      >
                        <Image className="h-4 w-4 mr-2" />
                        Add Photo
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
