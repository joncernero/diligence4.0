import { db } from '../db';
import { notifications, notificationPreferences } from '../schema/notifications';
import { users } from '../schema/users';
import { eq } from 'drizzle-orm';
import { sendEmail, emailTemplates } from './email';

interface CreateNotificationParams {
  userId: number;
  type: string;
  title: string;
  message: string;
  relatedEntityType?: string;
  relatedEntityId?: number;
  actionUrl?: string;
  metadata?: any;
}

export async function createNotification(params: CreateNotificationParams) {
  try {
    // Get user preferences
    const prefs = await db.query.notificationPreferences.findFirst({
      where: eq(notificationPreferences.userId, params.userId),
    });

    // Get user details
    const user = await db.query.users.findFirst({
      where: eq(users.id, params.userId),
    });

    if (!user) {
      console.error('User not found for notification:', params.userId);
      return null;
    }

    // Determine if we should send in-app notification
    const shouldSendInApp = shouldSendInAppNotification(params.type, prefs);
    
    // Create in-app notification if enabled
    let notification = null;
    if (shouldSendInApp) {
      [notification] = await db.insert(notifications).values({
        userId: params.userId,
        type: params.type,
        title: params.title,
        message: params.message,
        relatedEntityType: params.relatedEntityType || null,
        relatedEntityId: params.relatedEntityId || null,
        actionUrl: params.actionUrl || null,
        metadata: params.metadata || null,
      }).returning();
    }

    // Determine if we should send email
    const shouldSendEmailNotif = shouldSendEmailNotification(params.type, prefs);
    
    if (shouldSendEmailNotif && user.userEmail) {
      // Send email asynchronously
      sendNotificationEmail(params, user).catch(err => {
        console.error('Failed to send notification email:', err);
      });

      // Mark email as sent
      if (notification) {
        await db.update(notifications)
          .set({ emailSent: true, emailSentAt: new Date() })
          .where(eq(notifications.id, notification.id));
      }
    }

    return notification;
  } catch (error) {
    console.error('Create notification error:', error);
    return null;
  }
}

function shouldSendInAppNotification(type: string, prefs: any): boolean {
  if (!prefs) return true; // Default to sending if no preferences set

  const mapping: Record<string, string> = {
    'observation_assigned': 'inAppObservationAssigned',
    'task_reminder': 'inAppTaskReminder',
    'task_overdue': 'inAppTaskOverdue',
    'walk_scheduled': 'inAppWalkScheduled',
    'document_uploaded': 'inAppDocumentUploaded',
    'comment_added': 'inAppCommentAdded',
  };

  const prefKey = mapping[type];
  return prefKey ? prefs[prefKey] !== false : true;
}

function shouldSendEmailNotification(type: string, prefs: any): boolean {
  if (!prefs) return true; // Default to sending if no preferences set

  const mapping: Record<string, string> = {
    'observation_assigned': 'emailObservationAssigned',
    'task_reminder': 'emailTaskReminder',
    'task_overdue': 'emailTaskOverdue',
    'walk_scheduled': 'emailWalkScheduled',
    'document_uploaded': 'emailDocumentUploaded',
    'comment_added': 'emailCommentAdded',
  };

  const prefKey = mapping[type];
  return prefKey ? prefs[prefKey] !== false : true;
}

async function sendNotificationEmail(params: CreateNotificationParams, user: any) {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const userName = `${user.userFirst} ${user.userLast}`;

  let emailHtml = '';
  const metadata = params.metadata || {};

  switch (params.type) {
    case 'observation_assigned':
      emailHtml = emailTemplates.observationAssigned({
        userName,
        observationTitle: metadata.observationTitle || 'Observation',
        projectName: metadata.projectName || 'Project',
        actionUrl: `${frontendUrl}${params.actionUrl}`,
      });
      break;

    case 'task_reminder':
      emailHtml = emailTemplates.taskReminder({
        userName,
        taskName: metadata.taskName || 'Task',
        dueDate: metadata.dueDate || 'Soon',
        projectName: metadata.projectName || 'Project',
        actionUrl: `${frontendUrl}${params.actionUrl}`,
      });
      break;

    case 'task_overdue':
      emailHtml = emailTemplates.taskOverdue({
        userName,
        taskName: metadata.taskName || 'Task',
        projectName: metadata.projectName || 'Project',
        actionUrl: `${frontendUrl}${params.actionUrl}`,
      });
      break;

    case 'walk_scheduled':
      emailHtml = emailTemplates.walkScheduled({
        userName,
        walkType: metadata.walkType || 'Walk',
        walkDate: metadata.walkDate || 'TBD',
        projectName: metadata.projectName || 'Project',
        actionUrl: `${frontendUrl}${params.actionUrl}`,
      });
      break;

    default:
      // Generic email template
      emailHtml = `
        <h2>${params.title}</h2>
        <p>${params.message}</p>
        ${params.actionUrl ? `<a href="${frontendUrl}${params.actionUrl}">View Details</a>` : ''}
      `;
  }

  await sendEmail({
    to: user.userEmail,
    subject: params.title,
    html: emailHtml,
  });
}

export async function markNotificationAsRead(notificationId: number) {
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.id, notificationId));
}

export async function markAllNotificationsAsRead(userId: number) {
  await db.update(notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(notifications.userId, userId));
}
