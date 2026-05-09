'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { approvalsApi, projectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Clock, CheckCircle2, AlertTriangle, ChevronDown, ChevronUp,
  Paperclip, Calendar, User, Tag,
} from 'lucide-react';

// ── Config ────────────────────────────────────────────────────────────────────

const TYPE_LABELS: Record<string, string> = {
  material_selection: 'Material Selection',
  schedule_approval:  'Schedule Approval',
  change_order:       'Change Order',
  daily_report:       'Daily Report',
  rfi:                'RFI',
  submittals:         'Submittals',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; icon: React.ElementType }> = {
  pending:        { label: 'Awaiting Review', bg: 'bg-amber-100 text-amber-700 ring-1 ring-amber-500/20',  icon: Clock },
  approved:       { label: 'Approved',        bg: 'bg-green-100 text-green-700 ring-1 ring-green-500/20',  icon: CheckCircle2 },
  rejected:       { label: 'Rejected',        bg: 'bg-red-100 text-red-700 ring-1 ring-red-500/20',        icon: AlertTriangle },
  info_requested: { label: 'More Info Needed',bg: 'bg-blue-100 text-blue-700 ring-1 ring-blue-500/20',    icon: AlertTriangle },
  withdrawn:      { label: 'Withdrawn',       bg: 'bg-gray-100 text-gray-500',                            icon: Clock },
};

const PRIORITY_CONFIG: Record<string, { label: string; dot: string }> = {
  urgent: { label: 'Urgent', dot: 'bg-red-500' },
  high:   { label: 'High',   dot: 'bg-orange-500' },
  medium: { label: 'Medium', dot: 'bg-blue-500' },
  low:    { label: 'Low',    dot: 'bg-gray-400' },
};

// ── Respond Modal ─────────────────────────────────────────────────────────────

function RespondModal({
  request, open, onOpenChange,
}: { request: any; open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const [decision, setDecision] = useState<'approved' | 'rejected' | 'info_requested'>('approved');
  const [note, setNote] = useState('');

  const mutation = useMutation({
    mutationFn: () => approvalsApi.respond(request.id, { status: decision, responseNote: note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      onOpenChange(false);
      setNote('');
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md mx-4 sm:mx-auto">
        <DialogHeader>
          <DialogTitle>Respond to Request</DialogTitle>
        </DialogHeader>

        <div className="py-2 space-y-4">
          <p className="text-sm font-medium text-gray-800">{request.title}</p>

          <div className="space-y-1.5">
            <Label>Your Decision</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { value: 'approved', label: '✓ Approve', active: 'bg-green-600 text-white', inactive: 'border hover:bg-green-50 hover:border-green-400 text-green-700' },
                  { value: 'rejected', label: '✗ Reject', active: 'bg-red-600 text-white', inactive: 'border hover:bg-red-50 hover:border-red-400 text-red-700' },
                  { value: 'info_requested', label: '? More Info', active: 'bg-blue-600 text-white', inactive: 'border hover:bg-blue-50 hover:border-blue-400 text-blue-700' },
                ] as const
              ).map(({ value, label, active, inactive }) => (
                <button
                  key={value}
                  onClick={() => setDecision(value)}
                  className={`py-2 px-2 rounded-lg text-sm font-medium transition-colors ${decision === value ? active : inactive}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="note">
              Note{decision === 'info_requested' ? ' (required — describe what you need)' : ' (optional)'}
            </Label>
            <textarea
              id="note"
              rows={3}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder={
                decision === 'approved' ? 'Optional approval note…'
                : decision === 'rejected' ? 'Reason for rejection…'
                : 'What additional information do you need?'
              }
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || (decision === 'info_requested' && !note.trim())}
          >
            {mutation.isPending ? 'Submitting…' : 'Submit Response'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Approval Card ─────────────────────────────────────────────────────────────

function ApprovalCard({ request }: { request: any }) {
  const [expanded, setExpanded] = useState(false);
  const [respondOpen, setRespondOpen] = useState(false);

  const statusCfg = STATUS_CONFIG[request.status] ?? STATUS_CONFIG.pending;
  const StatusIcon = statusCfg.icon;
  const priorityCfg = PRIORITY_CONFIG[request.priority] ?? PRIORITY_CONFIG.medium;
  const isPending = request.status === 'pending';
  const attachments: any[] = request.attachments || [];

  return (
    <>
      <Card className={`transition-shadow ${isPending ? 'hover:shadow-md border-l-4 border-l-amber-400' : ''}`}>
        <CardContent className="p-4 md:p-5">
          {/* Top row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <div className={`w-2 h-2 rounded-full shrink-0 ${priorityCfg.dot}`} />
                <span className="text-xs text-muted-foreground">
                  {TYPE_LABELS[request.type] ?? request.type}
                </span>
                {request.dueDate && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Due {new Date(request.dueDate).toLocaleDateString()}
                  </span>
                )}
              </div>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-snug">
                {request.title}
              </h3>
              {request.requester && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Submitted by {request.requester.userFirst} {request.requester.userLast}
                  · {new Date(request.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1 shrink-0 ${statusCfg.bg}`}>
              <StatusIcon className="h-3 w-3" />
              {statusCfg.label}
            </span>
          </div>

          {/* Description preview */}
          {request.description && (
            <p className={`text-sm text-gray-600 mt-2 ${!expanded ? 'line-clamp-2' : ''}`}>
              {request.description}
            </p>
          )}

          {/* Expanded: attachments + response note */}
          {expanded && (
            <div className="mt-3 space-y-3">
              {attachments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                    Attachments
                  </p>
                  <div className="space-y-1">
                    {attachments.map((a: any, i: number) => (
                      <a
                        key={i}
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-blue-600 hover:underline"
                      >
                        <Paperclip className="h-3 w-3 shrink-0" />
                        {a.fileName || `Attachment ${i + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {request.responseNote && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                    Your Response
                  </p>
                  <p className="text-sm text-gray-700">{request.responseNote}</p>
                  {request.respondedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(request.respondedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {expanded ? 'Show less' : 'Show details'}
            </button>
            {isPending && (
              <Button size="sm" onClick={() => setRespondOpen(true)}>
                Review & Respond
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <RespondModal
        request={request}
        open={respondOpen}
        onOpenChange={setRespondOpen}
      />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function OwnerApprovalsPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await projectsApi.getAll()).data.projects,
  });

  const projects = projectsData || [];
  const primaryProjectId = projects[0]?.id;

  const { data: requestsData, isLoading } = useQuery({
    queryKey: ['approvals', primaryProjectId],
    queryFn: async () => (await approvalsApi.getAll({ projectId: primaryProjectId })).data.requests,
    enabled: !!primaryProjectId,
    refetchInterval: 30_000,
  });

  const requests: any[] = requestsData || [];

  const filtered = requests.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (typeFilter !== 'all' && r.type !== typeFilter) return false;
    return true;
  });

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
          Approvals
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-sm font-bold bg-amber-500 text-white">
              {pendingCount}
            </span>
          )}
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review and respond to requests from your project team.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="info_requested">More Info Needed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent" />
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="font-medium text-gray-600">
              {requests.length === 0 ? 'No approval requests yet' : 'No requests match your filters'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {requests.length === 0
                ? 'Your project team will submit items here for your review.'
                : 'Try adjusting the filters above.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r: any) => (
            <ApprovalCard key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
