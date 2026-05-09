'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi, walksApi, projectsApi, workSchedulesApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TaskForm } from '@/components/TaskForm';
import { WorkScheduleForm } from '@/components/WorkScheduleForm';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import { Plus, HardHat, ChevronDown } from 'lucide-react';

// Trade type → purple shade so crew events are visually distinct
const TRADE_COLORS: Record<string, string> = {
  general:     '#7c3aed',
  plumbing:    '#2563eb',
  electrical:  '#d97706',
  hvac:        '#0891b2',
  framing:     '#92400e',
  drywall:     '#6b7280',
  paint:       '#ec4899',
  flooring:    '#059669',
  roofing:     '#dc2626',
  concrete:    '#374151',
  landscaping: '#16a34a',
  inspection:  '#7c3aed',
};

function getTradeColor(tradeType: string) {
  return TRADE_COLORS[tradeType] ?? '#7c3aed';
}

function getPriorityColor(priority: string) {
  const colors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f59e0b',
    medium: '#3b82f6',
    low: '#6b7280',
  };
  return colors[priority] || colors.medium;
}

export default function CalendarPage() {
  const queryClient = useQueryClient();
  const calendarRef = useRef<any>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [taskFormOpen, setTaskFormOpen] = useState(false);
  const [scheduleFormOpen, setScheduleFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [calendarReady, setCalendarReady] = useState(false);

  // Detect mobile before rendering
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    setCalendarReady(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Switch view live when resizing
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api || !calendarReady) return;
    const currentView = api.view.type;
    if (isMobile && ['dayGridMonth', 'timeGridWeek', 'timeGridDay'].includes(currentView)) {
      api.changeView('listWeek');
    } else if (!isMobile && currentView === 'listWeek') {
      api.changeView('dayGridMonth');
    }
  }, [isMobile, calendarReady]);

  // Fetch projects
  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await projectsApi.getAll()).data.projects,
  });

  // Fetch tasks
  const { data: tasksData } = useQuery({
    queryKey: ['tasks', selectedProjectId],
    queryFn: async () => {
      const params = selectedProjectId !== 'all' ? { projectId: selectedProjectId } : {};
      return (await tasksApi.getAll(params)).data.tasks;
    },
  });

  // Fetch walks
  const { data: walksData } = useQuery({
    queryKey: ['walks', selectedProjectId],
    queryFn: async () => {
      const params = selectedProjectId !== 'all' ? { projectId: selectedProjectId } : {};
      return (await walksApi.getAll(params)).data.walks;
    },
  });

  // Fetch crew/work schedule events
  const { data: schedulesData } = useQuery({
    queryKey: ['workSchedules', selectedProjectId],
    queryFn: async () => {
      const params = selectedProjectId !== 'all' ? { projectId: selectedProjectId } : {};
      return (await workSchedulesApi.getAll(params)).data.schedules;
    },
  });

  const projects = projectsData || [];
  const tasks = tasksData || [];
  const walks = walksData || [];
  const workSchedules = schedulesData || [];

  // Update task date on drag
  const updateTaskMutation = useMutation({
    mutationFn: ({ id, scheduledDate }: { id: number; scheduledDate: string }) =>
      tasksApi.update(id, { scheduledDate }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  // Build FullCalendar events
  const events = [
    // Tasks
    ...tasks.map((task: any) => ({
      id: `task-${task.id}`,
      title: task.taskName,
      start: task.scheduledDate,
      end: task.dueDate || task.scheduledDate,
      backgroundColor: getPriorityColor(task.priority),
      borderColor: getPriorityColor(task.priority),
      extendedProps: { type: 'task', data: task },
    })),
    // Property walks
    ...walks.map((walk: any) => ({
      id: `walk-${walk.id}`,
      title: `🚶 ${walk.walkType.replace(/_/g, ' ')}`,
      start: walk.walkDate,
      backgroundColor: '#10b981',
      borderColor: '#10b981',
      extendedProps: { type: 'walk', data: walk },
    })),
    // Crew / work schedule events (multi-day)
    ...workSchedules.map((ws: any) => ({
      id: `ws-${ws.id}`,
      title: `🔧 ${ws.title}`,
      start: ws.startDate,
      end: (() => {
        // FullCalendar end date for all-day events is exclusive
        const d = new Date(ws.endDate);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      })(),
      allDay: true,
      backgroundColor: getTradeColor(ws.tradeType),
      borderColor: getTradeColor(ws.tradeType),
      extendedProps: { type: 'workSchedule', data: ws },
    })),
  ];

  const handleDateClick = (arg: any) => {
    setSelectedDate(new Date(arg.dateStr));
    setSelectedEvent(null);
    setTaskFormOpen(true);
  };

  const handleEventClick = (info: any) => {
    const { type, data } = info.event.extendedProps;
    if (type === 'task') {
      setSelectedEvent(data);
      setSelectedSchedule(null);
      setTaskFormOpen(true);
    } else if (type === 'workSchedule') {
      setSelectedSchedule(data);
      setSelectedEvent(null);
      setScheduleFormOpen(true);
    }
    // walks: could navigate to walk detail
  };

  const handleEventDrop = (info: any) => {
    const { type, data } = info.event.extendedProps;
    if (type === 'task') {
      updateTaskMutation.mutate({
        id: data.id,
        scheduledDate: info.event.start.toISOString(),
      });
    }
  };

  // Currently selected project's propertyId (for creating work schedules)
  const selectedProject = projects.find((p: any) => p.id.toString() === selectedProjectId);

  return (
    <div className="p-4 md:p-8 space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Schedule walks, tasks, and crew work
          </p>
        </div>

        {/* Add button — dropdown on larger screens, two buttons on mobile */}
        <div className="flex gap-2">
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                  <ChevronDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => {
                  setSelectedDate(undefined); setSelectedEvent(null); setTaskFormOpen(true);
                }}>
                  Add Task
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => {
                  setSelectedDate(undefined); setSelectedSchedule(null); setScheduleFormOpen(true);
                }}>
                  <HardHat className="h-4 w-4 mr-2" />
                  Schedule Crew / Work
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Mobile: two separate buttons */}
          <div className="flex sm:hidden gap-2">
            <Button size="sm" variant="outline" onClick={() => {
              setSelectedDate(undefined); setSelectedSchedule(null); setScheduleFormOpen(true);
            }}>
              <HardHat className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => {
              setSelectedDate(undefined); setSelectedEvent(null); setTaskFormOpen(true);
            }}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Forms */}
      <TaskForm
        open={taskFormOpen}
        onOpenChange={setTaskFormOpen}
        defaultDate={selectedDate}
        existingTask={selectedEvent}
      />
      <WorkScheduleForm
        open={scheduleFormOpen}
        onOpenChange={(o) => { setScheduleFormOpen(o); if (!o) setSelectedSchedule(null); }}
        defaultDate={selectedDate}
        existingSchedule={selectedSchedule}
        projectId={selectedProject?.id}
        propertyId={selectedProject?.propertyId}
      />

      {/* Filter */}
      <Card>
        <CardContent className="p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="text-sm font-medium whitespace-nowrap">Filter by Project:</label>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger className="w-full sm:w-[300px]">
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
          </div>
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card>
        <CardContent className="p-2 md:p-6">
          {!calendarReady ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-current border-r-transparent mr-3" />
              Loading calendar...
            </div>
          ) : (
            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
              initialView={isMobile ? 'listWeek' : 'dayGridMonth'}
              headerToolbar={
                isMobile
                  ? { left: 'prev,next', center: 'title', right: 'listWeek,dayGridMonth' }
                  : { left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,listWeek' }
              }
              events={events}
              editable={!isMobile}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={isMobile ? 2 : 4}
              weekends={true}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              eventDrop={handleEventDrop}
              height="auto"
              eventDisplay="block"
              listDaySideFormat={{ weekday: 'short', month: 'short', day: 'numeric' }}
              noEventsContent="No events this week"
              eventContent={(arg) => {
                // Show contractor name as subtitle on crew events in month/week view
                if (arg.event.extendedProps.type === 'workSchedule' && !isMobile) {
                  const ws = arg.event.extendedProps.data;
                  return (
                    <div className="px-1 py-0.5 text-white overflow-hidden">
                      <div className="font-medium text-xs truncate">{arg.event.title}</div>
                      {ws.contractor && (
                        <div className="text-xs opacity-80 truncate">{ws.contractor}</div>
                      )}
                    </div>
                  );
                }
                // Return undefined to use FullCalendar's default rendering for all other event types
              }}
            />
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Legend</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-4 gap-y-2">
            <p className="col-span-full text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Tasks</p>
            {[
              { color: 'bg-red-500', label: 'Urgent' },
              { color: 'bg-amber-500', label: 'High Priority' },
              { color: 'bg-blue-500', label: 'Medium' },
              { color: 'bg-gray-500', label: 'Low Priority' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded shrink-0 ${color}`} />
                <span className="text-xs">{label}</span>
              </div>
            ))}
            <p className="col-span-full text-xs font-semibold text-gray-500 uppercase tracking-wide mt-2 mb-1">Walks & Crew</p>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded shrink-0 bg-emerald-500" />
              <span className="text-xs">Property Walks</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded shrink-0 bg-violet-600" />
              <span className="text-xs">Crew / Work Schedule</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
