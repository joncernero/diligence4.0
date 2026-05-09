import { Resend } from 'resend';
import * as dotenv from 'dotenv';

dotenv.config();

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail({ to, subject, html, from }: SendEmailParams) {
  try {
    const fromEmail = from || process.env.EMAIL_FROM || 'notifications@constructionpm.com';
    
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Email send exception:', error);
    return { success: false, error };
  }
}

// Email Templates
export const emailTemplates = {
  observationAssigned: (data: { userName: string; observationTitle: string; projectName: string; actionUrl: string }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>New Observation Assigned</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>You have been assigned a new observation on <strong>${data.projectName}</strong>.</p>
            <p><strong>Observation:</strong> ${data.observationTitle}</p>
            <p>Please review and take appropriate action.</p>
            <a href="${data.actionUrl}" class="button">View Observation</a>
          </div>
          <div class="footer">
            <p>Construction Project Management System</p>
          </div>
        </div>
      </body>
    </html>
  `,

  taskReminder: (data: { userName: string; taskName: string; dueDate: string; projectName: string; actionUrl: string }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Task Reminder</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>This is a reminder about an upcoming task on <strong>${data.projectName}</strong>.</p>
            <p><strong>Task:</strong> ${data.taskName}</p>
            <p><strong>Due Date:</strong> ${data.dueDate}</p>
            <a href="${data.actionUrl}" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>Construction Project Management System</p>
          </div>
        </div>
      </body>
    </html>
  `,

  taskOverdue: (data: { userName: string; taskName: string; projectName: string; actionUrl: string }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Task Overdue</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>The following task on <strong>${data.projectName}</strong> is now overdue.</p>
            <p><strong>Task:</strong> ${data.taskName}</p>
            <p>Please complete this task as soon as possible.</p>
            <a href="${data.actionUrl}" class="button">View Task</a>
          </div>
          <div class="footer">
            <p>Construction Project Management System</p>
          </div>
        </div>
      </body>
    </html>
  `,

  walkCompleted: (data: { userName: string; walkType: string; walkDate: string; projectName: string; observationCount: number; actionUrl: string }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8b5cf6; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .stat { display: inline-block; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px 20px; margin: 10px 5px 0 0; text-align: center; }
          .stat-number { font-size: 24px; font-weight: bold; color: #8b5cf6; }
          .stat-label { font-size: 12px; color: #6b7280; }
          .button { display: inline-block; background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Walk Completed</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>A property walk has been completed for <strong>${data.projectName}</strong>.</p>
            <p><strong>Walk Type:</strong> ${data.walkType}</p>
            <p><strong>Date:</strong> ${data.walkDate}</p>
            <div>
              <div class="stat">
                <div class="stat-number">${data.observationCount}</div>
                <div class="stat-label">Observations Recorded</div>
              </div>
            </div>
            <p style="margin-top: 20px;">Please review the observations and assign any outstanding items.</p>
            <a href="${data.actionUrl}" class="button">View Walk Report</a>
          </div>
          <div class="footer">
            <p>Construction Project Management System</p>
          </div>
        </div>
      </body>
    </html>
  `,

  observationStatusChange: (data: { userName: string; observationTitle: string; oldStatus: string; newStatus: string; projectName: string; actionUrl: string }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #0ea5e9; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .status-change { display: flex; align-items: center; gap: 12px; background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0; }
          .status-badge { display: inline-block; padding: 4px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; }
          .status-old { background: #fee2e2; color: #991b1b; }
          .status-new { background: #d1fae5; color: #065f46; }
          .arrow { font-size: 20px; color: #6b7280; }
          .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Observation Status Updated</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>The status of an observation on <strong>${data.projectName}</strong> has been updated.</p>
            <p><strong>Observation:</strong> ${data.observationTitle}</p>
            <div class="status-change">
              <span class="status-badge status-old">${data.oldStatus.replace(/_/g, ' ')}</span>
              <span class="arrow">→</span>
              <span class="status-badge status-new">${data.newStatus.replace(/_/g, ' ')}</span>
            </div>
            <a href="${data.actionUrl}" class="button">View Observation</a>
          </div>
          <div class="footer">
            <p>Construction Project Management System</p>
          </div>
        </div>
      </body>
    </html>
  `,

  walkScheduled: (data: { userName: string; walkType: string; walkDate: string; projectName: string; actionUrl: string }) => `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #10b981; color: white; padding: 20px; text-align: center; }
          .content { background: #f9fafb; padding: 30px; }
          .button { display: inline-block; background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Property Walk Scheduled</h1>
          </div>
          <div class="content">
            <p>Hi ${data.userName},</p>
            <p>A property walk has been scheduled for <strong>${data.projectName}</strong>.</p>
            <p><strong>Type:</strong> ${data.walkType}</p>
            <p><strong>Date:</strong> ${data.walkDate}</p>
            <a href="${data.actionUrl}" class="button">View Walk Details</a>
          </div>
          <div class="footer">
            <p>Construction Project Management System</p>
          </div>
        </div>
      </body>
    </html>
  `,
};
