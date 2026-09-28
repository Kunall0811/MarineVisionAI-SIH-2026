"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fs = __importStar(require("fs"));
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const reports_service_1 = require("./reports.service");
const surveys_service_1 = require("../surveys/surveys.service");
const mail_events_service_1 = require("../mail/mail-events.service");
const audit_service_1 = require("../audit/audit.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const MIME = {
    PDF: 'application/pdf',
    CSV: 'text/csv',
    JSON: 'application/json',
    GEOJSON: 'application/geo+json',
};
let ReportsController = class ReportsController {
    constructor(reportsService, surveysService, mailEvents, auditService, realtime) {
        this.reportsService = reportsService;
        this.surveysService = surveysService;
        this.mailEvents = mailEvents;
        this.auditService = auditService;
        this.realtime = realtime;
    }
    async generate(user, surveyId, format = 'PDF') {
        if (user.role === 'OPERATOR' && user.operatorPermissions?.canGenerateReports === false) {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have permission to generate reports.' },
            });
        }
        const survey = await this.surveysService.findById(surveyId);
        if (user.role === 'OPERATOR' && !this.surveysService.isOperatorAssigned(survey, user.userId)) {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this survey.' },
            });
        }
        const report = await this.reportsService.generate(surveyId, format, user.userId);
        this.realtime.emitEvent('report_generated', {
            reportId: report._id,
            surveyId,
            format,
            detectionCount: report.detectionCount,
        });
        await this.auditService.record({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: 'REPORT_GENERATED',
            category: 'REPORTS',
            targetType: 'Report',
            targetId: String(report._id),
            metadata: { surveyId, format, detectionCount: report.detectionCount },
        });
        await this.mailEvents.dispatch('REPORT_GENERATED', `Survey report generated: ${survey.code} (${format})`, `<div style="font-family:sans-serif"><h3>Survey report generated</h3><p>Survey <b>${survey.name}</b> (${survey.code}) - ${format} report with ${report.detectionCount} detection(s) generated by ${user.email}.</p></div>`, `Survey report generated: ${survey.name} (${survey.code}) - ${format} - ${report.detectionCount} detections.`, { surveyId, reportId: String(report._id), format, severity: 'INFO' });
        return { success: true, data: report };
    }
    async list(page = '1', limit = '30', surveyId) {
        const filter = {};
        if (surveyId)
            filter.surveyId = surveyId;
        const { items, total } = await this.reportsService.findAll(parseInt(page, 10), parseInt(limit, 10), filter);
        return { success: true, data: items, meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } };
    }
    async download(id, res) {
        const report = await this.reportsService.findById(id);
        if (!report) {
            throw new common_1.NotFoundException({ success: false, error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });
        }
        const absolutePath = this.reportsService.getAbsolutePath(report.storagePath);
        if (!fs.existsSync(absolutePath)) {
            throw new common_1.NotFoundException({ success: false, error: { code: 'REPORT_FILE_MISSING', message: 'Report file is missing on disk.' } });
        }
        res.setHeader('Content-Type', MIME[report.format] || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
        fs.createReadStream(absolutePath).pipe(res);
    }
    async emailReport(user, id, recipientEmails) {
        const report = await this.reportsService.findById(id);
        if (!report) {
            throw new common_1.NotFoundException({ success: false, error: { code: 'REPORT_NOT_FOUND', message: 'Report not found.' } });
        }
        const absolutePath = this.reportsService.getAbsolutePath(report.storagePath);
        const targetRecipients = recipientEmails && recipientEmails.length > 0
            ? recipientEmails
            : [user.email, 'asonawane260686@gmail.com'];
        await this.mailEvents.dispatch('REPORT_GENERATED', `MarineVision AI: Official Survey Report ${report.surveyCode} (${report.format})`, `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #0e7490;border-radius:8px">
        <h2 style="color:#0e7490">MarineVision AI — Survey Mission Report</h2>
        <p>Official report for survey <b>${report.surveyCode}</b> has been generated in format <b>${report.format}</b>.</p>
        <p>Total Detections Logged: <b>${report.detectionCount}</b></p>
        <p>Requested by: <b>${user.email}</b></p>
        <p>Attached: <b>${report.fileName}</b></p>
      </div>`, `Official report for survey ${report.surveyCode} (${report.format}) with ${report.detectionCount} detections. Requested by ${user.email}.`, {
            reportId: String(report._id),
            reportPath: absolutePath,
            fileName: report.fileName,
            recipientEmails: targetRecipients,
            manualSend: true,
            severity: 'INFO',
        });
        await this.reportsService.markEmailed(id, targetRecipients);
        await this.auditService.record({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: 'REPORT_EMAILED',
            category: 'REPORTS',
            targetType: 'Report',
            targetId: id,
            metadata: { recipientEmails: recipientEmails || [] },
        });
        return { success: true, data: { queued: true } };
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Post)('surveys/:surveyId/generate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('surveyId')),
    __param(2, (0, common_1.Body)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('surveyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id/download'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "download", null);
__decorate([
    (0, common_1.Post)(':id/email'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('recipientEmails')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "emailReport", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)('reports'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reports_service_1.ReportsService,
        surveys_service_1.SurveysService,
        mail_events_service_1.MailEventsService,
        audit_service_1.AuditService,
        realtime_gateway_1.RealtimeGateway])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map