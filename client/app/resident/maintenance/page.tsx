'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Wrench, Plus, X, CheckCircle, Clock, AlertCircle,
  Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'plumbing', label: '🔧 Plumbing', desc: 'Leaks, drains, toilets, water pressure' },
  { value: 'electrical', label: '⚡ Electrical', desc: 'Outlets, lights, breakers' },
  { value: 'hvac', label: '❄️ HVAC', desc: 'Heating, cooling, ventilation' },
  { value: 'appliance', label: '🍳 Appliance', desc: 'Stove, refrigerator, dishwasher' },
  { value: 'doors_windows', label: '🚪 Doors & Windows', desc: 'Locks, seals, hardware' },
  { value: 'pest', label: '🐜 Pest', desc: 'Insects, rodents' },
  { value: 'other', label: '📋 Other', desc: 'Anything not listed above' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', desc: 'Non-urgent, can wait', color: 'text-green-700 bg-green-50 border-green-200' },
  { value: 'medium', label: 'Medium', desc: 'Needs attention soon', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  { value: 'high', label: 'High', desc: 'Impacting daily life', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  { value: 'urgent', label: 'Urgent', desc: 'Safety concern or water damage', color: 'text-red-700 bg-red-50 border-red-200' },
];

const STATUS_LABELS: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
  submitted: {
    label: 'Submitted',
    icon: <Clock className='h-3.5 w-3.5' />,
    className: 'bg-blue-100 text-blue-700',
  },
  acknowledged: {
    label: 'Acknowledged',
    icon: <CheckCircle className='h-3.5 w-3.5' />,
    className: 'bg-indigo-100 text-indigo-700',
  },
  in_progress: {
    label: 'In Progress',
    icon: <Wrench className='h-3.5 w-3.5' />,
    className: 'bg-yellow-100 text-yellow-700',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle className='h-3.5 w-3.5' />,
    className: 'bg-green-100 text-green-700',
  },
  closed: {
    label: 'Closed',
    icon: <CheckCircle className='h-3.5 w-3.5' />,
    className: 'bg-gray-100 text-gray-600',
  },
};

export default function ResidentMaintenancePage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['maintenanceRequests'],
    queryFn: async () => (await maintenanceApi.getMyRequests()).data.requests,
  });

  const requests = data || [];
  const openRequests = requests.filter((r: any) => !['completed', 'closed'].includes(r.status));
  const closedRequests = requests.filter((r: any) => ['completed', 'closed'].includes(r.status));

  const createMutation = useMutation({
    mutationFn: (data: any) => maintenanceApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['maintenanceRequests'] });
      setTitle('');
      setDescription('');
      setCategory('');
      setPriority('medium');
      setShowForm(false);
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 4000);
    },
  });

  function handleSubmit() {
    if (!title.trim() || !description.trim() || !category) return;
    createMutation.mutate({ title: title.trim(), description: description.trim(), category, priority });
  }

  const canSubmit = title.trim().length > 0 && description.trim().length > 5 && category !== '';

  function RequestCard({ req }: { req: any }) {
    const isExpanded = expandedId === req.id;
    const statusInfo = STATUS_LABELS[req.status] || { label: req.status, icon: null, className: 'bg-gray-100 text-gray-600' };
    const catLabel = CATEGORIES.find(c => c.value === req.category)?.label || req.category;

    return (
      <Card className='overflow-hidden'>
        <button
          className='w-full text-left'
          onClick={() => setExpandedId(isExpanded ? null : req.id)}
        >
          <CardContent className='p-4'>
            <div className='flex items-start justify-between gap-3'>
              <div className='flex-1 min-w-0'>
                <div className='flex flex-wrap items-center gap-1.5 mb-1.5'>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${statusInfo.className}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                  {req.priority === 'urgent' && (
                    <span className='text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium'>Urgent</span>
                  )}
                  {req.priority === 'high' && (
                    <span className='text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium'>High</span>
                  )}
                </div>
                <p className='font-semibold text-gray-900 truncate'>{req.title}</p>
                <p className='text-xs text-muted-foreground mt-0.5'>{catLabel}</p>
              </div>
              <div className='shrink-0 text-gray-400 mt-1'>
                {isExpanded ? <ChevronUp className='h-4 w-4' /> : <ChevronDown className='h-4 w-4' />}
              </div>
            </div>
          </CardContent>
        </button>

        {isExpanded && (
          <div className='border-t border-gray-100 px-4 pb-4 pt-3 space-y-3'>
            <p className='text-sm text-gray-700'>{req.description}</p>
            <div className='flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground'>
              <span>Submitted {new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              {req.unitNumber && <span>Unit {req.unitNumber}</span>}
            </div>
            {req.staffNotes && (
              <div className='bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5'>
                <p className='text-xs font-medium text-blue-700 mb-1'>Note from management</p>
                <p className='text-sm text-blue-800'>{req.staffNotes}</p>
              </div>
            )}
            {req.assignee && (
              <p className='text-xs text-muted-foreground'>
                Assigned to: <span className='font-medium'>{req.assignee.userFirst} {req.assignee.userLast}</span>
              </p>
            )}
          </div>
        )}
      </Card>
    );
  }

  return (
    <div className='p-4 space-y-4'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-gray-900'>Maintenance</h1>
          <p className='text-sm text-muted-foreground mt-0.5'>Submit and track requests</p>
        </div>
        {!showForm && (
          <Button size='sm' onClick={() => setShowForm(true)}>
            <Plus className='h-4 w-4 mr-1' /> New Request
          </Button>
        )}
      </div>

      {/* Success banner */}
      {submitted && (
        <div className='flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm'>
          <CheckCircle className='h-4 w-4 shrink-0' />
          Request submitted! We'll acknowledge it shortly.
        </div>
      )}

      {/* Submission form */}
      {showForm && (
        <Card className='border-blue-200'>
          <CardHeader className='pb-2 pt-4 px-4'>
            <div className='flex items-center justify-between'>
              <CardTitle className='text-base'>New Maintenance Request</CardTitle>
              <button
                onClick={() => setShowForm(false)}
                className='text-gray-400 hover:text-gray-600'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
          </CardHeader>
          <CardContent className='px-4 pb-5 space-y-4'>
            {/* Title */}
            <div>
              <label className='text-sm font-medium text-gray-700 block mb-1.5'>
                Issue Title <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                placeholder='e.g. Leaking faucet in kitchen'
                value={title}
                onChange={e => setTitle(e.target.value)}
                className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
              />
            </div>

            {/* Category */}
            <div>
              <label className='text-sm font-medium text-gray-700 block mb-1.5'>
                Category <span className='text-red-500'>*</span>
              </label>
              <div className='grid grid-cols-1 gap-1.5'>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setCategory(cat.value)}
                    className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                      category === cat.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <span className='text-base shrink-0 mt-0.5'>{cat.label.split(' ')[0]}</span>
                    <div>
                      <p className='text-sm font-medium text-gray-900'>{cat.label.split(' ').slice(1).join(' ')}</p>
                      <p className='text-xs text-muted-foreground'>{cat.desc}</p>
                    </div>
                    {category === cat.value && (
                      <CheckCircle className='h-4 w-4 text-blue-500 shrink-0 ml-auto mt-0.5' />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className='text-sm font-medium text-gray-700 block mb-1.5'>Priority</label>
              <div className='grid grid-cols-2 gap-2'>
                {PRIORITIES.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setPriority(p.value)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      priority === p.value ? p.color + ' border-current' : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <p className='text-sm font-semibold'>{p.label}</p>
                    <p className='text-xs text-muted-foreground mt-0.5'>{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label className='text-sm font-medium text-gray-700 block mb-1.5'>
                Description <span className='text-red-500'>*</span>
              </label>
              <textarea
                placeholder='Describe the issue in detail — when it started, how severe it is, any relevant details…'
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className='w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none'
              />
            </div>

            <Button
              className='w-full'
              disabled={!canSubmit || createMutation.isPending}
              onClick={handleSubmit}
            >
              {createMutation.isPending ? (
                <><Loader2 className='h-4 w-4 mr-2 animate-spin' /> Submitting…</>
              ) : (
                <><Wrench className='h-4 w-4 mr-2' /> Submit Request</>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className='flex justify-center py-8'>
          <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
        </div>
      )}

      {/* Open requests */}
      {!isLoading && openRequests.length > 0 && (
        <div>
          <h2 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
            Active ({openRequests.length})
          </h2>
          <div className='space-y-2.5'>
            {openRequests.map((r: any) => <RequestCard key={r.id} req={r} />)}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && requests.length === 0 && !showForm && (
        <Card>
          <CardContent className='py-16 text-center'>
            <Wrench className='h-12 w-12 text-gray-300 mx-auto mb-3' />
            <p className='text-gray-500 font-medium'>No maintenance requests</p>
            <p className='text-xs text-muted-foreground mt-1 mb-4'>
              Use the button above to submit a new request
            </p>
            <Button size='sm' onClick={() => setShowForm(true)}>
              <Plus className='h-4 w-4 mr-1' /> Submit Request
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Completed requests */}
      {!isLoading && closedRequests.length > 0 && (
        <div>
          <h2 className='text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2'>
            Completed ({closedRequests.length})
          </h2>
          <div className='space-y-2.5 opacity-75'>
            {closedRequests.map((r: any) => <RequestCard key={r.id} req={r} />)}
          </div>
        </div>
      )}
    </div>
  );
}
