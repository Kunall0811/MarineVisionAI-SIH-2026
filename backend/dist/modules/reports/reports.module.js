"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const report_schema_1 = require("./schemas/report.schema");
const reports_service_1 = require("./reports.service");
const reports_controller_1 = require("./reports.controller");
const surveys_module_1 = require("../surveys/surveys.module");
const detections_module_1 = require("../detections/detections.module");
const sonar_module_1 = require("../sonar/sonar.module");
const storage_module_1 = require("../storage/storage.module");
const mail_module_1 = require("../mail/mail.module");
const audit_module_1 = require("../audit/audit.module");
let ReportsModule = class ReportsModule {
};
exports.ReportsModule = ReportsModule;
exports.ReportsModule = ReportsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: report_schema_1.Report.name, schema: report_schema_1.ReportSchema }]),
            surveys_module_1.SurveysModule,
            detections_module_1.DetectionsModule,
            sonar_module_1.SonarModule,
            storage_module_1.StorageModule,
            mail_module_1.MailModule,
            audit_module_1.AuditModule,
        ],
        providers: [reports_service_1.ReportsService],
        controllers: [reports_controller_1.ReportsController],
        exports: [reports_service_1.ReportsService],
    })
], ReportsModule);
//# sourceMappingURL=reports.module.js.map