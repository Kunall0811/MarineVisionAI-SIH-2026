import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { MailService } from './mail.service';
import { MailEventsService } from './mail-events.service';
import { MailQueueProcessor } from './mail.processor';
import { MailController } from './mail.controller';
import { EmailRecipientsService } from './email-recipients.service';
import { EmailLogService } from './email-log.service';
import { EmailRecipient, EmailRecipientSchema } from './schemas/email-recipient.schema';
import { EmailLog, EmailLogSchema } from './schemas/email-log.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EmailRecipient.name, schema: EmailRecipientSchema },
      { name: EmailLog.name, schema: EmailLogSchema },
    ]),
    BullModule.registerQueue({ name: 'mail' }),
    NotificationsModule,
    AuditModule,
  ],
  providers: [MailService, MailEventsService, MailQueueProcessor, EmailRecipientsService, EmailLogService],
  controllers: [MailController],
  exports: [MailService, MailEventsService, EmailRecipientsService, EmailLogService],
})
export class MailModule {}
