'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { observationsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft, MapPin, Clock, Wrench, Camera, MessageSquare,
  Send, CheckCircle, AlertCircle, Loader2, Image as ImageIcon,
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Mark Resolved' },
];

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700 border-red-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-200',
  resolved: 'bg-green-100 text-green-700 border-green-200',
  verified: 'bg-purple-100 text-purple-700 border-purple-200',
  closed: 'bg-gray-100 text-gray-600 border-gray-200',
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'text-red-600',
  major: 'text-orange-600',
  minor: 'text-yellow-600',
  cosmetic: 'text-blue-600',
};

export default function ContractorObservationPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const observationId = parseInt(params.id as string);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [comment, setComment] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [photoCaption, setPhotoCaption] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['observation', observationId],
    queryFn: async () => (await observationsApi.getById(observationId)).data.observation,
  });

  const obs = data;

  const updateMutation = useMutation({
    mutationFn: (updates: any) => observationsApi.update(observationId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observation', observationId] });
      queryClient.invalidateQueries({ queryKey: ['assigned-observations'] });
      setNewStatus('');
      showSuccess('Status updated successfully');
    },
  });

  const commentMutation = useMutation({
    mutationFn: (text: string) =>
      observationsApi.addComment(observationId, { comment: text, commentType: 'comment' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observation', observationId] });
      setComment('');
      showSuccess('Comment added');
    },
  });

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('photoType', 'after');
      if (photoCaption) formData.append('caption', photoCaption);
      return observationsApi.addPhoto(observationId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['observation', observationId] });
      setPhotoPreview(null);
      setSelectedFile(null);
      setPhotoCaption('');
      showSuccess('Photo uploaded');
    },
  });

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(''), 3000);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  function handleStatusUpdate() {
    if (!newStatus || newStatus === obs?.status) return;
    updateMutation.mutate({ status: newStatus });
  }

  if (isLoading) {
    return (
      <div className='p-4 flex justify-center py-20'>
        <Loader2 className='h-8 w-8 animate-spin text-blue-600' />
      </div>
    );
  }

  if (!obs) {
    return (
      <div className='p-4 text-center py-20'>
        <AlertCircle className='h-12 w-12 text-gray-300 mx-auto mb-3' />
        <p className='text-gray-500'>Observation not found</p>
        <Button variant='ghost' className='mt-4' onClick={() => router.back()}>
          <ArrowLeft className='h-4 w-4 mr-2' /> Back
        </Button>
      </div>
    );
  }

  const isLocked = ['verified', 'closed', 'wont_fix'].includes(obs.status);

  return (
    <div className='p-4 space-y-4'>
      {/* Back + success message */}
      <div className='flex items-center gap-3'>
        <Button variant='ghost' size='sm' onClick={() => router.back()}>
          <ArrowLeft className='h-4 w-4 mr-1' /> Back
        </Button>
        {successMessage && (
          <span className='text-sm text-green-600 flex items-center gap-1 font-medium'>
            <CheckCircle className='h-4 w-4' /> {successMessage}
          </span>
        )}
      </div>

      {/* Header */}
      <div>
        <div className='flex flex-wrap gap-2 mb-2'>
          <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${STATUS_COLORS[obs.status] || 'bg-gray-100 text-gray-600'}`}>
            {obs.status?.replace(/_/g, ' ')}
          </span>
          {obs.severity && (
            <span className={`text-xs font-medium ${SEVERITY_COLORS[obs.severity] || 'text-gray-500'}`}>
              {obs.severity} severity
            </span>
          )}
          {obs.priority && obs.priority !== 'medium' && (
            <Badge variant='outline' className='text-xs capitalize'>{obs.priority} priority</Badge>
          )}
        </div>
        <h1 className='text-xl font-bold text-gray-900'>{obs.title}</h1>
        <p className='text-sm text-muted-foreground mt-1'>{obs.description}</p>
      </div>

      {/* Details card */}
      <Card>
        <CardContent className='p-4 space-y-3 text-sm'>
          {obs.project && (
            <div className='flex gap-3'>
              <span className='text-muted-foreground w-24 shrink-0'>Project</span>
              <span className='font-medium'>{obs.project.projectName}</span>
            </div>
          )}
          {obs.location && (
            <div className='flex gap-3'>
              <span className='text-muted-foreground w-24 shrink-0'>Location</span>
              <span className='flex items-center gap-1'>
                <MapPin className='h-3.5 w-3.5 text-gray-400' /> {obs.location}
              </span>
            </div>
          )}
          {obs.tradeType && (
            <div className='flex gap-3'>
              <span className='text-muted-foreground w-24 shrink-0'>Trade</span>
              <span className='flex items-center gap-1 capitalize'>
                <Wrench className='h-3.5 w-3.5 text-gray-400' /> {obs.tradeType}
              </span>
            </div>
          )}
          {obs.dueDate && (
            <div className='flex gap-3'>
              <span className='text-muted-foreground w-24 shrink-0'>Due Date</span>
              <span className='flex items-center gap-1'>
                <Clock className='h-3.5 w-3.5 text-gray-400' />
                {new Date(obs.dueDate).toLocaleDateString('en-US', {
                  weekday: 'short', month: 'short', day: 'numeric',
                })}
              </span>
            </div>
          )}
          {obs.category && (
            <div className='flex gap-3'>
              <span className='text-muted-foreground w-24 shrink-0'>Category</span>
              <span className='capitalize'>{obs.category?.replace(/_/g, ' ')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status update (locked if verified/closed) */}
      {!isLocked && (
        <Card>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-base'>Update Status</CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 space-y-3'>
            <div className='grid grid-cols-3 gap-2'>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setNewStatus(opt.value)}
                  disabled={obs.status === opt.value}
                  className={`py-2 px-3 rounded-lg text-sm font-medium border transition-all ${
                    newStatus === opt.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : obs.status === opt.value
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:text-blue-700'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <Button
              className='w-full'
              disabled={!newStatus || newStatus === obs.status || updateMutation.isPending}
              onClick={handleStatusUpdate}
            >
              {updateMutation.isPending ? (
                <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Saving…</>
              ) : (
                'Confirm Status Update'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLocked && (
        <div className='flex items-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-4 py-3'>
          <CheckCircle className='h-4 w-4 shrink-0' />
          This observation has been {obs.status} — no further updates needed.
        </div>
      )}

      {/* Photo upload */}
      {!isLocked && (
        <Card>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-base flex items-center gap-2'>
              <Camera className='h-4 w-4' /> Upload Resolution Photo
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4 space-y-3'>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/*'
              capture='environment'
              className='hidden'
              onChange={handleFileSelect}
            />

            {!photoPreview && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className='w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors'
              >
                <Camera className='h-8 w-8' />
                <span className='text-sm font-medium'>Take or choose a photo</span>
                <span className='text-xs'>Max 10MB</span>
              </button>
            )}

            {photoPreview && (
              <div className='space-y-3'>
                <div className='relative rounded-xl overflow-hidden'>
                  <img src={photoPreview} alt='Preview' className='w-full object-cover max-h-64' />
                  <button
                    onClick={() => { setPhotoPreview(null); setSelectedFile(null); }}
                    className='absolute top-2 right-2 bg-black/50 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm hover:bg-black/70'
                  >
                    ✕
                  </button>
                </div>
                <input
                  type='text'
                  placeholder='Add a caption (optional)'
                  value={photoCaption}
                  onChange={e => setPhotoCaption(e.target.value)}
                  className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
                />
                <Button
                  className='w-full'
                  disabled={photoMutation.isPending}
                  onClick={() => selectedFile && photoMutation.mutate(selectedFile)}
                >
                  {photoMutation.isPending ? (
                    <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Uploading…</>
                  ) : (
                    <><Camera className='h-4 w-4 mr-2' /> Upload Photo</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Existing photos */}
      {obs.photos && obs.photos.length > 0 && (
        <Card>
          <CardHeader className='pb-2 pt-4 px-4'>
            <CardTitle className='text-base flex items-center gap-2'>
              <ImageIcon className='h-4 w-4' /> Photos ({obs.photos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className='px-4 pb-4'>
            <div className='grid grid-cols-2 gap-2'>
              {obs.photos.map((photo: any) => (
                <div key={photo.id} className='relative rounded-lg overflow-hidden bg-gray-100'>
                  <img
                    src={photo.photoUrl}
                    alt={photo.caption || photo.fileName || 'Photo'}
                    className='w-full aspect-square object-cover'
                  />
                  {(photo.photoType || photo.caption) && (
                    <div className='absolute bottom-0 left-0 right-0 bg-black/40 px-2 py-1'>
                      {photo.photoType && (
                        <span className='text-xs text-white/80 capitalize'>{photo.photoType}</span>
                      )}
                      {photo.caption && (
                        <p className='text-xs text-white truncate'>{photo.caption}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Comments */}
      <Card>
        <CardHeader className='pb-2 pt-4 px-4'>
          <CardTitle className='text-base flex items-center gap-2'>
            <MessageSquare className='h-4 w-4' /> Comments & Updates
          </CardTitle>
        </CardHeader>
        <CardContent className='px-4 pb-4 space-y-4'>
          {/* Comment list */}
          {obs.comments && obs.comments.length > 0 ? (
            <div className='space-y-3'>
              {[...obs.comments].reverse().map((c: any) => (
                <div
                  key={c.id}
                  className={`rounded-lg px-3 py-2.5 text-sm ${
                    c.commentType === 'status_change'
                      ? 'bg-blue-50 border border-blue-100 text-blue-700'
                      : 'bg-gray-50 border border-gray-100 text-gray-700'
                  }`}
                >
                  <div className='flex items-center justify-between gap-2 mb-1'>
                    <span className='font-medium text-xs'>
                      {c.user ? `${c.user.userFirst} ${c.user.userLast}` : 'System'}
                    </span>
                    <span className='text-xs text-muted-foreground'>
                      {new Date(c.createdAt).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p>{c.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-sm text-muted-foreground text-center py-2'>No comments yet</p>
          )}

          {/* New comment input */}
          {!isLocked && (
            <div className='flex gap-2'>
              <input
                type='text'
                placeholder='Add a note or update…'
                value={comment}
                onChange={e => setComment(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && comment.trim()) {
                    commentMutation.mutate(comment.trim());
                  }
                }}
                className='flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
              <Button
                size='icon'
                disabled={!comment.trim() || commentMutation.isPending}
                onClick={() => comment.trim() && commentMutation.mutate(comment.trim())}
              >
                {commentMutation.isPending
                  ? <Loader2 className='h-4 w-4 animate-spin' />
                  : <Send className='h-4 w-4' />
                }
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
