import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Survey, SurveySchema } from './schemas/survey.schema';
import { SurveysService } from './surveys.service';
import { SurveysController } from './surveys.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: Survey.name, schema: SurveySchema }])],
  providers: [SurveysService],
  controllers: [SurveysController],
  exports: [SurveysService, MongooseModule],
})
export class SurveysModule {}
