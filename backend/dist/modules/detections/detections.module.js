"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetectionsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const detection_schema_1 = require("./schemas/detection.schema");
const detections_service_1 = require("./detections.service");
const detections_controller_1 = require("./detections.controller");
const anomalies_controller_1 = require("./anomalies.controller");
const surveys_module_1 = require("../surveys/surveys.module");
const mail_module_1 = require("../mail/mail.module");
const audit_module_1 = require("../audit/audit.module");
const notifications_module_1 = require("../notifications/notifications.module");
let DetectionsModule = class DetectionsModule {
};
exports.DetectionsModule = DetectionsModule;
exports.DetectionsModule = DetectionsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: detection_schema_1.Detection.name, schema: detection_schema_1.DetectionSchema }]),
            surveys_module_1.SurveysModule,
            mail_module_1.MailModule,
            audit_module_1.AuditModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [detections_service_1.DetectionsService],
        controllers: [detections_controller_1.DetectionsController, anomalies_controller_1.AnomaliesController],
        exports: [detections_service_1.DetectionsService, mongoose_1.MongooseModule],
    })
], DetectionsModule);
//# sourceMappingURL=detections.module.js.map