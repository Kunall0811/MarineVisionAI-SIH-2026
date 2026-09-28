"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const throttler_1 = require("@nestjs/throttler");
const configuration_1 = __importDefault(require("./config/configuration"));
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const mail_module_1 = require("./modules/mail/mail.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const surveys_module_1 = require("./modules/surveys/surveys.module");
const sonar_module_1 = require("./modules/sonar/sonar.module");
const detections_module_1 = require("./modules/detections/detections.module");
const ai_inference_module_1 = require("./modules/ai-inference/ai-inference.module");
const geolocation_module_1 = require("./modules/geolocation/geolocation.module");
const storage_module_1 = require("./modules/storage/storage.module");
const water_bodies_module_1 = require("./modules/water-bodies/water-bodies.module");
const globe_module_1 = require("./modules/globe/globe.module");
const map_module_1 = require("./modules/map/map.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const audit_module_1 = require("./modules/audit/audit.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const reports_module_1 = require("./modules/reports/reports.module");
const ai_training_module_1 = require("./modules/ai-training/ai-training.module");
const friday_module_1 = require("./modules/friday/friday.module");
const historical_module_1 = require("./modules/historical/historical.module");
const ai_status_module_1 = require("./modules/ai-status/ai-status.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true, load: [configuration_1.default] }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({ uri: config.get('mongodbUri') }),
            }),
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    connection: {
                        url: config.get('redisUrl'),
                        enableOfflineQueue: false,
                        maxRetriesPerRequest: 1,
                        connectTimeout: 1000,
                    },
                }),
            }),
            throttler_1.ThrottlerModule.forRoot([{ ttl: 60000, limit: 120 }]),
            realtime_module_1.RealtimeModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            mail_module_1.MailModule,
            surveys_module_1.SurveysModule,
            storage_module_1.StorageModule,
            ai_inference_module_1.AiInferenceModule,
            geolocation_module_1.GeolocationModule,
            sonar_module_1.SonarModule,
            detections_module_1.DetectionsModule,
            water_bodies_module_1.WaterBodiesModule,
            globe_module_1.GlobeModule,
            map_module_1.MapModule,
            dashboard_module_1.DashboardModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
            reports_module_1.ReportsModule,
            ai_training_module_1.AiTrainingModule,
            friday_module_1.FridayModule,
            historical_module_1.HistoricalModule,
            ai_status_module_1.AiStatusModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map