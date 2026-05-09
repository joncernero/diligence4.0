'use client';

import { useQuery } from '@tanstack/react-query';
import { residentsApi, walksApi, bulletinsApi, workSchedulesApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import {
  Calendar,
  Clock,
  User,
  CheckCircle2,
  ClipboardList,
  Ban,
  Wrench,
  Zap,
  AlertTriangle,
  PartyPopper,
  MessageSquare,
  HardHat,
} from 'lucide-react';

// ─── types ───────────────────────────────────────────────────────────────────

type CalendarEvent =
  | { type: 'walk';         date: Date; data: any }
  | { type: 'bulletin';     date: Date; data: any }
  | { type: 'workSchedule'; date: Date; endDate: Date; data: any };

// ─── helpers ─────────────────────────────────────────────────────────────────

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function groupEvents(events: CalendarEvent[]) {
  const now        = new Date();
  const todayStart = startOfDay(now);
  const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
  const weekEnd    = new Date(todayStart);    weekEnd.setDate(weekEnd.getDate() + 7);

  const groups: Record<string, CalendarEvent[]> = {
    Today: [], Tomorrow: [], 'This Week': [], 'Coming Up': [], Past: [],
  };

  for (const evt of events) {
    const dayStart = startOfDay(evt.date);
    if      (dayStart.getTime() === todayStart.getTime())    groups['Today'].push(evt);
    else if (dayStart.getTime() === tomorrowStart.getTime()) groups['Tomorrow'].push(evt);
    else if (evt.date > now && evt.date <= weekEnd)          groups['This Week'].push(evt);
    else if (evt.date > weekEnd)                             groups['Coming Up'].push(evt);
    else                                                     groups['Past'].push(evt);
  }

  const ascending  = (a: CalendarEvent, b: CalendarEvent) => a.date.getTime() - b.date.getTime();
  const descending = (a: CalendarEvent, b: CalendarEvent) => b.date.getTime() - a.date.getTime();
  ['Today', 'Tomorrow', 'This Week', 'Coming Up'].forEach((k) => groups[k].sort(ascending));
  groups['Past'].sort(descending);

  return groups;
}

// ─── walk display config ─────────────────────────────────────────────────────

const walkTypeLabels: Record<string, string> = {
  initial:     'Initial Inspection',
  pre_drywall: 'Pre-Drywall Walk',
  rough_in:    'Rough-In Inspection',
  punch_list:  'Punch List Walk',
  final:       'Final Walk',
  warranty:    'Warranty Walk',
  quality:     'Quality Check',
  safety:      'Safety Inspection',
};

const walkStatusConfig: Record<string, { label: string; badge: string }> = {
  scheduled:   { label: 'Scheduled',   badge: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20' },
  in_progress: { label: 'In Progress', badge: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20' },
  completed:   { label: 'Completed',   badge: 'bg-green-100 text-green-700 ring-1 ring-green-600/20' },
  cancelled:   { label: 'Cancelled',   badge: 'bg-gray-100 text-gray-400' },
};

// ─── bulletin display config ──────────────────────────────────────────────────

const bulletinConfig: Record<
  string,
  { label: string; badge: string; icon: React.ElementType; dateBg: string; dateText: string }
> = {
  work_notice:     { label: 'Work Notice',     badge: 'bg-blue-100 text-blue-700 ring-1 ring-blue-600/20',    icon: Wrench,       dateBg: 'bg-blue-50',   dateText: 'text-blue-700' },
  utility_shutoff: { label: 'Utility Shutoff', badge: 'bg-orange-100 text-orange-700 ring-1 ring-orange-600/20', icon: Zap,       dateBg: 'bg-orange-50', dateText: 'text-orange-700' },
  access_notice:   { label: 'Access Notice',   badge: 'bg-yellow-100 text-yellow-700 ring-1 ring-yellow-600/20', icon: AlertTriangle, dateBg: 'bg-yellow-50', dateText: 'text-yellow-700' },
  completion:      { label: 'Completion',      badge: 'bg-green-100 text-green-700 ring-1 ring-green-600/20',  icon: PartyPopper, dateBg: 'bg-green-50',  dateText: 'text-green-700' },
  general:         { label: 'Notice',          badge: 'bg-gray-100 text-gray-700',                            icon: MessageSquare, dateBg: 'bg-gray-100',  dateText: 'text-gray-600' },
};

const groupAccentColor: Record<string, string> = {
  Today:        'bg-blue-600',
  Tomorrow:     'bg-indigo-400',
  'This Week':  'bg-purple-400',
  'Coming Up':  'bg-gray-400',
  Past:         'bg-gray-300',
};

// ─── sub-components ───────────────────────────────────────────────────────────

function DateBlock({ date, bg, textColor }: { date: Date; bg: string; textColor: string }) {
  return (
    <div className={`flex flex-col items-center justify-center rounded-xl px-3 py-2 shrink-0 min-w-[52px] text-center ${bg}`}>
      <span className={`text-xs font-semibold uppercase ${textColor} opacity-80`}>
        {date.toLocaleDateString(undefined, { month: 'short' })}
      </span>
      <span className={`text-2xl font-bold leading-tight ${textColor}`}>
        {date.getDate()}
      </span>
      <span className={`text-xs ${textColor} opacity-70`}>
        {date.toLocaleDateString(undefined, { weekday: 'short' })}
      </span>
    </div>
  );
}

function WalkCard({ walk, isPast }: { walk: any; isPast: boolean }) {
  const date   = new Date(walk.walkDate);
  const status = walkStatusConfig[walk.walkStatus] ?? walkStatusConfig.scheduled;

  return (
    <Card className={`transition-shadow ${isPast ? 'opacity-60' : 'hover:shadow-md'}`}>
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          <DateBlock
            date={date}
            bg={isPast ? 'bg-gray-100' : 'bg-blue-50'}
            textColor={isPast ? 'text-gray-500' : 'text-blue-700'}
          />
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2 mb-1.5'>
              <h3 className='font-semibold text-sm text-gray-900 leading-snug'>
                {walkTypeLabels[walk.walkType] ??
                  walk.walkType?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${status.badge}`}>
                {status.label}
              </span>
            </div>
            <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-1'>
              <Clock className='h-3.5 w-3.5 shrink-0' />
              <span>
                {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {walk.conductor && (
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <User className='h-3.5 w-3.5 shrink-0' />
                <span>{walk.conductor.userFirst} {walk.conductor.userLast}</span>
              </div>
            )}
            {walk.notes && (
              <p className='text-xs text-gray-500 mt-1.5 line-clamp-2 italic'>"{walk.notes}"</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BulletinEventCard({ bulletin, isPast }: { bulletin: any; isPast: boolean }) {
  const date   = new Date(bulletin.scheduledDate);
  const config = bulletinConfig[bulletin.category] ?? bulletinConfig.general;
  const Icon   = config.icon;

  return (
    <Card className={`transition-shadow ${isPast ? 'opacity-60' : 'hover:shadow-md'}`}>
      <CardContent className='p-4'>
        <div className='flex items-start gap-3'>
          <DateBlock
            date={date}
            bg={isPast ? 'bg-gray-100' : config.dateBg}
            textColor={isPast ? 'text-gray-500' : config.dateText}
          />
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between gap-2 mb-1.5'>
              <h3 className='font-semibold text-sm text-gray-900 leading-snug'>
                {bulletin.title}
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1 ${config.badge}`}>
                <Icon className='h-3 w-3' />
                {config.label}
              </span>
            </div>
            {date.getHours() !== 0 && (
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground mb-1'>
                <Clock className='h-3.5 w-3.5 shrink-0' />
                <span>{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            )}
            {bulletin.body && (
              <p className='text-xs text-gray-500 mt-1 line-clamp-2'>{bulletin.body}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── work schedule card ───────────────────────────────────────────────────────

const tradeLabels: Record<string, string> = {
  general: 'General Work', plumbing: 'Plumbing', electrical: 'Electrical',
  hvac: 'HVAC', framing: 'Framing', drywall: 'Drywall', paint: 'Paint',
  flooring: 'Flooring', roofing: 'Roofing', concrete: 'Concrete',
  landscaping: 'Landscaping', inspection: 'Inspection',
};

function WorkScheduleCard({ ws, isPast }: { ws: any; isPast: boolean }) {
  const startDate = new Date(ws.startDate);
  const endDate = new Date(ws.endDate);
  const isMultiDay = ws.startDate !== ws.endDate;

  return (
    <Card className={`transition-shadow ${isPast ? 'opacity-60' : 'hover:shadow-md'}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <DateBlock
            date={startDate}
            bg={isPast ? 'bg-gray-100' : 'bg-violet-50'}
            textColor={isPast ? 'text-gray-500' : 'text-violet-700'}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h3 className="font-semibold text-sm text-gray-900 leading-snug">{ws.title}</h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 flex items-center gap-1 bg-violet-100 text-violet-700 ring-1 ring-violet-600/20">
                <HardHat className="h-3 w-3" />
                {tradeLabels[ws.tradeType] ?? ws.tradeType}
              </span>
            </div>
            {isMultiDay && (
              <p className="text-xs text-muted-foreground mb-1">
                Through {endDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </p>
            )}
            {ws.contractor && (
              <p className="text-xs text-muted-foreground">Contractor: {ws.contractor}</p>
            )}
            {ws.areaDescription && (
              <p className="text-xs text-muted-foreground mt-0.5">📍 {ws.areaDescription}</p>
            )}
            {ws.notes && (
              <p className="text-xs text-gray-500 mt-1.5 line-clamp-2 italic">"{ws.notes}"</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function ResidentCalendarPage() {
  const { data: unitData } = useQuery({
    queryKey: ['residentMe'],
    queryFn: async () => (await residentsApi.getMe()).data.unit,
  });

  const propertyId = unitData?.propertyId ?? unitData?.building?.propertyId;

  const { data: walksData, isLoading: walksLoading } = useQuery({
    queryKey: ['residentWalks', propertyId],
    queryFn: async () => (await walksApi.getAll({ propertyId })).data.walks,
    enabled: !!propertyId,
  });

  const { data: bulletinsData, isLoading: bulletinsLoading } = useQuery({
    queryKey: ['bulletins'],
    queryFn: async () => (await bulletinsApi.getAll()).data.bulletins,
    enabled: !!propertyId,
  });

  const { data: workScheduleData, isLoading: wsLoading } = useQuery({
    queryKey: ['residentWorkSchedules', propertyId, unitData?.buildingId, unitData?.unitNumber],
    queryFn: async () => (await workSchedulesApi.getResident({
      propertyId,
      buildingId: unitData?.buildingId,
      unitNumber: unitData?.unitNumber,
    })).data.schedules,
    enabled: !!propertyId,
  });

  const isLoading = walksLoading || bulletinsLoading || wsLoading;

  // Build unified event list
  const events: CalendarEvent[] = [
    ...(walksData || [])
      .filter((w: any) => w.walkStatus !== 'cancelled')
      .map((w: any) => ({ type: 'walk' as const, date: new Date(w.walkDate), data: w })),
    ...(bulletinsData || [])
      .filter((b: any) => b.scheduledDate)
      .map((b: any) => ({ type: 'bulletin' as const, date: new Date(b.scheduledDate), data: b })),
    ...(workScheduleData || [])
      .filter((ws: any) => ws.status !== 'cancelled')
      .map((ws: any) => ({
        type: 'workSchedule' as const,
        date: new Date(ws.startDate),
        endDate: new Date(ws.endDate),
        data: ws,
      })),
  ];

  const grouped = groupEvents(events);
  const hasAny  = Object.values(grouped).some((g) => g.length > 0);
  const upcomingCount = ['Today', 'Tomorrow', 'This Week', 'Coming Up'].reduce(
    (sum, k) => sum + grouped[k].length, 0,
  );

  return (
    <div className='p-4 space-y-5'>
      {/* Header */}
      <div>
        <h1 className='text-xl font-bold text-gray-900'>Work Schedule</h1>
        <p className='text-sm text-muted-foreground mt-0.5'>
          Upcoming inspections and work notices for your property
        </p>
      </div>

      {/* Summary pill */}
      {!isLoading && upcomingCount > 0 && (
        <div className='flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl border border-blue-100'>
          <Calendar className='h-4 w-4 text-blue-600 shrink-0' />
          <p className='text-sm text-blue-800 font-medium'>
            {upcomingCount} upcoming event{upcomingCount !== 1 ? 's' : ''} scheduled
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className='flex flex-col items-center justify-center py-16 gap-3'>
          <div className='inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent text-blue-600' />
          <p className='text-sm text-gray-500'>Loading schedule…</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !hasAny && (
        <Card>
          <CardContent className='py-16 text-center'>
            <div className='p-4 bg-gray-100 rounded-2xl inline-block mb-4'>
              <ClipboardList className='h-10 w-10 text-gray-400' />
            </div>
            <h3 className='font-semibold text-gray-700 mb-1'>Nothing scheduled yet</h3>
            <p className='text-sm text-muted-foreground max-w-xs mx-auto'>
              Your property manager will add inspections and work notices here as they're scheduled.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grouped event list */}
      {!isLoading &&
        Object.entries(grouped).map(([groupLabel, groupEvents]) => {
          if (groupEvents.length === 0) return null;
          const isPast = groupLabel === 'Past';

          return (
            <div key={groupLabel}>
              <div className='flex items-center gap-2 mb-2'>
                <div className={`h-4 w-1 rounded-full ${groupAccentColor[groupLabel] ?? 'bg-gray-400'}`} />
                <h2 className='text-xs font-bold uppercase tracking-wide text-gray-500'>
                  {groupLabel}
                </h2>
                <span className='text-xs text-muted-foreground bg-gray-100 px-2 py-0.5 rounded-full'>
                  {groupEvents.length}
                </span>
              </div>

              <div className='space-y-2'>
                {groupEvents.map((evt, i) =>
                  evt.type === 'walk' ? (
                    <WalkCard key={`walk-${evt.data.id}`} walk={evt.data} isPast={isPast} />
                  ) : evt.type === 'workSchedule' ? (
                    <WorkScheduleCard key={`ws-${evt.data.id}`} ws={evt.data} isPast={isPast} />
                  ) : (
                    <BulletinEventCard key={`bulletin-${evt.data.id}`} bulletin={evt.data} isPast={isPast} />
                  ),
                )}
              </div>
            </div>
          );
        })}
    </div>
  );
}
