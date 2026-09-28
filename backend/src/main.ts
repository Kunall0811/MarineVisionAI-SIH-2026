import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { WsAdapter } from '@nestjs/platform-ws';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { UsersService } from './modules/users/users.service';
import { seedDemoAccounts } from './seed/seed-demo-accounts';
import { HistoricalService } from './modules/historical/historical.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: false });
  app.useWebSocketAdapter(new WsAdapter(app));

  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
  const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    credentials: true,
  });

  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('MarineVision AI API')
    .setDescription(
      'SIH26057 - AI-Powered Automated Underwater Marine Debris and Anomaly ' +
        'Detection System using Side-Scan Sonar Imagery. All data returned by ' +
        'this API is sourced from MongoDB, uploaded sonar files, or AI model ' +
        'inference. Historical/demo records are always tagged accordingly.',
    )
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // Demo accounts: enabled by default outside production, disable with
  // AUTO_SEED_DEMO=false. See seed-demo-accounts.ts for credentials.
  const autoSeed = process.env.AUTO_SEED_DEMO !== 'false' && process.env.NODE_ENV !== 'production';
  if (autoSeed) {
    const usersService = app.get(UsersService);
    await seedDemoAccounts(usersService, { log: (msg: string) => console.log(`[SeedDemoAccounts] ${msg}`) });
    if (process.env.AUTO_SEED_HISTORICAL !== 'false') {
      const historicalService = app.get(HistoricalService);
      const seeded = await historicalService.seedDefaults();
      console.log(`[SeedHistorical] upserted=${seeded.upserted} modified=${seeded.modified}`);
    }
  }

  const port = process.env.PORT || 4000;
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`MarineVision AI backend listening on port ${port}`);
  // eslint-disable-next-line no-console
  console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}

bootstrap();
