import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { SonarFrame, SonarFrameSchema } from './schemas/sonar-frame.schema';
import { SonarService } from './sonar.service';
import { SonarController } from './sonar.controller';
import { SonarProcessingService } from './sonar-processing.service';
import { SonarQueueProcessor } from './sonar.processor';
import { SurveysModule } from '../surveys/surveys.module';
import { StorageModule } from '../storage/storage.module';
import { AiInferenceModule } from '../ai-inference/ai-inference.module';
import { GeolocationModule } from '../geolocation/geolocation.module';
import { DetectionsModule } from '../detections/detections.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: SonarFrame.name, schema: SonarFrameSchema }]),
    BullModule.registerQueue({ name: 'sonar-processing' }),
    SurveysModule,
    StorageModule,
    AiInferenceModule,
    GeolocationModule,
    DetectionsModule,
    MailModule,
  ],
  providers: [SonarService, SonarProcessingService, SonarQueueProcessor],
  controllers: [SonarController],
  exports: [SonarService, MongooseModule],
})
export class SonarModule {}
