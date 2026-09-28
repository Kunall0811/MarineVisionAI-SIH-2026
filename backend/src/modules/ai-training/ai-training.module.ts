import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { Dataset, DatasetSchema } from './schemas/dataset.schema';
import { DatasetImage, DatasetImageSchema } from './schemas/dataset-image.schema';
import { TrainingJob, TrainingJobSchema } from './schemas/training-job.schema';
import { ModelVersion, ModelVersionSchema } from './schemas/model-version.schema';
import { DatasetsService } from './datasets.service';
import { AiTrainingService } from './ai-training.service';
import { ModelVersionsService } from './model-versions.service';
import { TrainerService } from './trainer.service';
import { AiTrainingProcessor } from './training.processor';
import { AiTrainingController } from './ai-training.controller';
import { StorageModule } from '../storage/storage.module';
import { AuditModule } from '../audit/audit.module';
import { DetectionsModule } from '../detections/detections.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SurveysModule } from '../surveys/surveys.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dataset.name, schema: DatasetSchema },
      { name: DatasetImage.name, schema: DatasetImageSchema },
      { name: TrainingJob.name, schema: TrainingJobSchema },
      { name: ModelVersion.name, schema: ModelVersionSchema },
    ]),
    BullModule.registerQueue({ name: 'ai-training' }),
    StorageModule,
    AuditModule,
    DetectionsModule,
    NotificationsModule,
    SurveysModule,
    MailModule,
  ],
  providers: [DatasetsService, AiTrainingService, ModelVersionsService, TrainerService, AiTrainingProcessor],
  controllers: [AiTrainingController],
  exports: [DatasetsService, AiTrainingService, ModelVersionsService],
})
export class AiTrainingModule {}
