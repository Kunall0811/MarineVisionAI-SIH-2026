import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from './mail.service';
import { EmailRecipientsService } from './email-recipients.service';
import { EmailLogService } from './email-log.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';

/**
 * Consumes 'mail' queue jobs pushed by MailEventsService.dispatch().
 * Resolves the configured authority recipients for the event, sends via
 * MailService (SMTP/Nodemailer, or LOGGED_ONLY if SMTP isn't configured),
 * writes an EmailLog row, mirrors the alert as an in-app Notification for
 * every Admin, and broadcasts an `email_sent` realtime event.
 */
@Processor('mail', { concurrency: 5 })
export class MailQueueProcessor extends WorkerHost {
  private readonly logger = new Logger('MailQueueProcessor');

  constructor(
    private mailService: MailService,
    private recipientsService: EmailRecipientsService,
    private emailLogService: EmailLogService,
    private notificationsService: NotificationsService,
    private realtime: RealtimeGateway,
  ) {
    super();
  }

  async process(job: Job): Promise<any> {
    const { event, subject, html, text, metadata } = job.data;

    const recipients = await this.recipientsService.findByEvent(event);
    let toList = recipients.map((r) => r.email);

    // Merge explicitly provided recipient emails from metadata (e.g. from user reports or organizer requests)
    if (metadata?.recipientEmails && Array.isArray(metadata.recipientEmails)) {
      toList = Array.from(new Set([...toList, ...metadata.recipientEmails.filter(Boolean)]));
    } else if (metadata?.recipientEmail) {
      toList = Array.from(new Set([...toList, metadata.recipientEmail]));
    }

    // Default organizer fallback if no recipient is configured
    if (toList.length === 0) {
      toList = ['asonawane260686@gmail.com'];
    }

    // Attach report file if reportPath is provided in metadata
    const attachments: { filename: string; path?: string }[] = [];
    if (metadata?.reportPath) {
      try {
        const fs = await import('fs');
        if (fs.existsSync(metadata.reportPath)) {
          attachments.push({
            filename: metadata.fileName || 'MarineVision_Sonar_Report.pdf',
            path: metadata.reportPath,
          });
        }
      } catch (attErr: any) {
        this.logger.warn(`Could not attach report file: ${attErr.message}`);
      }
    }

    try {
      const result = await this.mailService.send({ to: toList, subject, html, text, attachments });
      await this.emailLogService.record({
        to: toList.join(', '),
        subject,
        triggerEvent: event,
        status: result.status,
        messageId: result.messageId || '',
        metadata,
      });
      this.realtime.emitEvent('email_sent', { event, to: toList, status: result.status, subject });
      await this.notificationsService.createForAdmins({
        type: event,
        title: subject,
        message: text?.slice(0, 280) || subject,
        severity: metadata?.severity || 'INFO',
        metadata,
      });
      return { sent: result.status === 'SENT', status: result.status };
    } catch (err: any) {
      this.logger.error(`Failed to send ${event} email: ${err.message}`);
      await this.emailLogService.record({
        to: toList.join(', '),
        subject,
        triggerEvent: event,
        status: 'FAILED',
        errorMessage: err.message,
        metadata,
      });
      return { sent: false, status: 'FAILED', error: err.message };
    }
  }
}
