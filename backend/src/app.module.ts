import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { MailModule } from './modules/mail/mail.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { SurveysModule } from './modules/surveys/surveys.module';
import { SonarModule } from './modules/sonar/sonar.module';
import { DetectionsModule } from './modules/detections/detections.module';
import { AiInferenceModule } from './modules/ai-inference/ai-inference.module';
import { GeolocationModule } from './modules/geolocation/geolocation.module';
import { StorageModule } from './modules/storage/storage.module';
import { WaterBodiesModule } from './modules/water-bodies/water-bodies.module';
import { GlobeModule } from './modules/globe/globe.module';
import { MapModule } from './modules/map/map.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditModule } from './modules/audit/audit.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ReportsModule } from './modules/reports/reports.module';
import { AiTrainingModule } from './modules/ai-training/ai-training.module';
import { FridayModule } from './modules/friday/friday.module';
import { HistoricalModule } from './modules/historical/historical.module';
import { AiStatusModule } from './modules/ai-status/ai-status.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ uri: config.get('mongodbUri') }),
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get('redisUrl'),
          enableOfflineQueue: false,
          maxRetriesPerRequest: 1,
          connectTimeout: 1000,
        },
      }),
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),

    RealtimeModule, // @Global - registers the WebSocket gateway once

    AuthModule,
    UsersModule,
    MailModule,
    SurveysModule,
    StorageModule,
    AiInferenceModule,
    GeolocationModule,
    SonarModule,
    DetectionsModule,
    WaterBodiesModule,
    GlobeModule,
    MapModule,
    DashboardModule,
    AuditModule,
    NotificationsModule,
    ReportsModule,
    AiTrainingModule,
    FridayModule,
    HistoricalModule,
    AiStatusModule,
  ],
})
export class AppModule {}
