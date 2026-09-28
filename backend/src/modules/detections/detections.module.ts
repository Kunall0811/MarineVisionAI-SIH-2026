import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Detection, DetectionSchema } from './schemas/detection.schema';
import { DetectionsService } from './detections.service';
import { DetectionsController } from './detections.controller';
import { AnomaliesController } from './anomalies.controller';
import { SurveysModule } from '../surveys/surveys.module';
import { MailModule } from '../mail/mail.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Detection.name, schema: DetectionSchema }]),
    SurveysModule,
    MailModule,
    AuditModule,
    NotificationsModule,
  ],
  providers: [DetectionsService],
  controllers: [DetectionsController, AnomaliesController],
  exports: [DetectionsService, MongooseModule],
})
export class DetectionsModule {}
