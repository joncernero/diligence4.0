'use client';

import { useQuery } from '@tanstack/react-query';
import { approvalsApi, projectsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import {
  CheckSquare, Clock, AlertTriangle, CheckCircle2,
  ChevronRight, Building2, TrendingUp,
} from 'lucide-react';

const TYPE_LABELS: Record<string, string> = {
  material_selection: 'Material Selection',
  schedule_approval:  'Schedule Approval',
  change_order:       'Change Order',
  daily_report:       'Daily Report',
  rfi:                'RFI',
  submittals:         'Submittals',
};

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pending:        { label: 'Pending',       className: 'bg-amber-100 text-amber-700',  icon: Clock },
  approved:       { label: 'Approved',      className: 'bg-green-100 text-green-700',  icon: CheckCircle2 },
  rejected:       { label: 'Rejected',      className: 'bg-red-100 text-red-700',      icon: AlertTriangle },
  info_requested: { label: 'More Info',     className: 'bg-blue-100 text-blue-700',    icon: AlertTriangle },
  withdrawn:      { label: 'Withdrawn',     className: 'bg-gray-100 text-gray-500',    icon: Clock },
};

const PRIORITY_DOT: Record<string, string> = {
  urgent: 'bg-red-500',
  high:   'bg-orange-500',
  medium: 'bg-blue-500',
  low:    'bg-gray-400',
};

export default function OwnerDashboard() {
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
  });

  const requests = requestsData || [];
  const pending = requests.filter((r: any) => r.status === 'pending');
  const urgent  = pending.filter((r: any) => r.priority === 'urgent' || r.priority === 'high');
  const recent  = requests.slice(0, 5);

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Project Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Welcome back. Here's what needs your attention.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          {
            label: 'Pending Approvals',
            value: pending.length,
            icon: Clock,
            bg: 'bg-amber-50',
            iconColor: 'text-amber-600',
            href: '/owner/approvals?status=pending',
          },
          {
            label: 'Urgent / High',
            value: urgent.length,
            icon: AlertTriangle,
            bg: 'bg-red-50',
            iconColor: 'text-red-600',
            href: '/owner/approvals?priority=urgent',
          },
          {
            label: 'Approved',
            value: requests.filter((r: any) => r.status === 'approved').length,
            icon: CheckCircle2,
            bg: 'bg-green-50',
            iconColor: 'text-green-600',
            href: '/owner/approvals?status=approved',
          },
          {
            label: 'Active Projects',
            value: projects.length,
            icon: Building2,
            bg: 'bg-blue-50',
            iconColor: 'text-blue-600',
            href: '/owner/approvals',
          },
        ].map(({ label, value, icon: Icon, bg, iconColor, href }) => (
          <Link key={label} href={href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 md:p-5 flex items-start gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${bg}`}>
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-gray-900">{value}</p>
                  <p className="text-xs text-muted-foreground leading-tight">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent requests */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Recent Activity</CardTitle>
          <Link
            href="/owner/approvals"
            className="text-sm text-blue-600 hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-r-transparent" />
            </div>
          ) : recent.length === 0 ? (
            <div className="text-center py-8">
              <CheckSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No approval requests yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {recent.map((r: any) => {
                const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
                const StatusIcon = cfg.icon;
                return (
                  <Link
                    key={r.id}
                    href={`/owner/approvals/${r.id}`}
                    className="flex items-start gap-3 py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${PRIORITY_DOT[r.priority] ?? 'bg-gray-400'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {TYPE_LABELS[r.type] ?? r.type} · {r.project?.projectName}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 flex items-center gap-1 ${cfg.className}`}>
                      <StatusIcon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Projects */}
      {projects.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Your Projects</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            {projects.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Building2 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{p.projectName}</p>
                    {p.projectNumber && (
                      <p className="text-xs text-muted-foreground">#{p.projectNumber}</p>
                    )}
                  </div>
                </div>
                <span className="text-xs text-gray-400 capitalize">{p.projectStatus || 'active'}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
