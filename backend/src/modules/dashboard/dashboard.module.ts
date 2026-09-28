import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DashboardController } from './dashboard.controller';
import { SurveysModule } from '../surveys/surveys.module';
import { DetectionsModule } from '../detections/detections.module';
import { AiInferenceModule } from '../ai-inference/ai-inference.module';

@Module({
  imports: [
    SurveysModule,
    DetectionsModule,
    AiInferenceModule,
    BullModule.registerQueue({ name: 'sonar-processing' }),
  ],
  controllers: [DashboardController],
})
export class DashboardModule {}
