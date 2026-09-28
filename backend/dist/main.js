"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const platform_ws_1 = require("@nestjs/platform-ws");
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const users_service_1 = require("./modules/users/users.service");
const seed_demo_accounts_1 = require("./seed/seed-demo-accounts");
const historical_service_1 = require("./modules/historical/historical.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { cors: false });
    app.useWebSocketAdapter(new platform_ws_1.WsAdapter(app));
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());
    app.enableCors({
        origin: (origin, callback) => {
            if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || allowedOrigins.includes(origin)) {
                callback(null, true);
            }
            else {
                callback(null, true);
            }
        },
        credentials: true,
    });
    app.use((0, helmet_1.default)({ crossOriginResourcePolicy: false }));
    app.use((0, compression_1.default)());
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    app.setGlobalPrefix('api');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('MarineVision AI API')
        .setDescription('SIH26057 - AI-Powered Automated Underwater Marine Debris and Anomaly ' +
        'Detection System using Side-Scan Sonar Imagery. All data returned by ' +
        'this API is sourced from MongoDB, uploaded sonar files, or AI model ' +
        'inference. Historical/demo records are always tagged accordingly.')
        .setVersion('0.1.0')
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document);
    const autoSeed = process.env.AUTO_SEED_DEMO !== 'false' && process.env.NODE_ENV !== 'production';
    if (autoSeed) {
        const usersService = app.get(users_service_1.UsersService);
        await (0, seed_demo_accounts_1.seedDemoAccounts)(usersService, { log: (msg) => console.log(`[SeedDemoAccounts] ${msg}`) });
        if (process.env.AUTO_SEED_HISTORICAL !== 'false') {
            const historicalService = app.get(historical_service_1.HistoricalService);
            const seeded = await historicalService.seedDefaults();
            console.log(`[SeedHistorical] upserted=${seeded.upserted} modified=${seeded.modified}`);
        }
    }
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`MarineVision AI backend listening on port ${port}`);
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map