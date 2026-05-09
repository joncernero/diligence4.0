'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Bell, Mail, Smartphone } from 'lucide-react';

export default function NotificationPreferencesPage() {
  const queryClient = useQueryClient();

  const { data: preferencesData, isLoading } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: async () => {
      const res = await notificationsApi.getPreferences();
      return res.data.preferences;
    },
  });

  const [formData, setFormData] = useState<any>(null);

  // Set form data when preferences load
  if (preferencesData && !formData) {
    setFormData(preferencesData);
  }

  const updateMutation = useMutation({
    mutationFn: (data: any) => notificationsApi.updatePreferences(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    },
  });

  const handleToggle = (field: string, value: boolean | number) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  if (isLoading || !formData) {
    return (
      <div className="p-4 md:p-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
            <p className="mt-4 text-sm text-gray-500">Loading preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  const notificationTypes = [
    { key: 'ObservationAssigned', label: 'Observation Assigned', description: 'When you are assigned an observation' },
    { key: 'TaskReminder', label: 'Task Reminder', description: 'Reminder before task is due' },
    { key: 'TaskOverdue', label: 'Task Overdue', description: 'When a task becomes overdue' },
    { key: 'WalkScheduled', label: 'Walk Scheduled', description: 'When a property walk is scheduled' },
    { key: 'DocumentUploaded', label: 'Document Uploaded', description: 'When a document is uploaded to a project' },
    { key: 'CommentAdded', label: 'Comment Added', description: 'When someone comments on your observation' },
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Notification Preferences</h1>
        <p className="text-muted-foreground mt-1">
          Manage how you receive notifications
        </p>
      </div>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Receive notifications via email</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData[`email${type.key}`]}
                    onChange={(e) => handleToggle(`email${type.key}`, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* In-App Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bell className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <CardTitle>In-App Notifications</CardTitle>
              <CardDescription>Receive notifications in the application</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {notificationTypes.map((type) => (
              <div key={type.key} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{type.label}</p>
                  <p className="text-xs text-muted-foreground">{type.description}</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData[`inApp${type.key}`]}
                    onChange={(e) => handleToggle(`inApp${type.key}`, e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Reminder Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Task Reminder Timing</CardTitle>
          <CardDescription>When to receive task reminders before due date</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="reminderDays">Remind me</Label>
            <Select
              value={formData.taskReminderDaysBefore?.toString() || '1'}
              onValueChange={(value) => handleToggle('taskReminderDaysBefore', parseInt(value))}
            >
              <SelectTrigger id="reminderDays" className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day before</SelectItem>
                <SelectItem value="2">2 days before</SelectItem>
                <SelectItem value="3">3 days before</SelectItem>
                <SelectItem value="7">1 week before</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>

      {updateMutation.isSuccess && (
        <div className="rounded-md bg-green-50 p-4 text-sm text-green-800">
          Preferences saved successfully!
        </div>
      )}
    </div>
  );
}
