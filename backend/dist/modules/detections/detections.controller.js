"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DetectionsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const detections_service_1 = require("./detections.service");
const surveys_service_1 = require("../surveys/surveys.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const mail_events_service_1 = require("../mail/mail-events.service");
const audit_service_1 = require("../audit/audit.service");
let DetectionsController = class DetectionsController {
    constructor(detectionsService, surveysService, realtime, mailEvents, auditService) {
        this.detectionsService = detectionsService;
        this.surveysService = surveysService;
        this.realtime = realtime;
        this.mailEvents = mailEvents;
        this.auditService = auditService;
    }
    async list(user, page = '1', limit = '50', klass, status, riskLevel, surveyId) {
        const filter = {};
        if (klass)
            filter.class = klass;
        if (status)
            filter.status = status;
        if (riskLevel)
            filter.riskLevel = riskLevel;
        if (surveyId)
            filter.surveyId = surveyId;
        if (user.role === 'OPERATOR' && surveyId) {
            const survey = await this.surveysService.findById(surveyId);
            if (!this.surveysService.isOperatorAssigned(survey, user.userId)) {
                throw new common_1.ForbiddenException({
                    success: false,
                    error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this survey.' },
                });
            }
        }
        const { items, total } = await this.detectionsService.findAll(filter, parseInt(page, 10), parseInt(limit, 10));
        return { success: true, data: items, meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } };
    }
    async get(id) {
        const detection = await this.detectionsService.findById(id);
        return { success: true, data: detection };
    }
    async bySurvey(surveyId) {
        const detections = await this.detectionsService.findBySurvey(surveyId);
        return { success: true, data: detections };
    }
    async verify(user, id, body) {
        if (user.role === 'OPERATOR' && user.operatorPermissions?.canVerifyDetections === false) {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have permission to verify detections.' },
            });
        }
        const detection = await this.detectionsService.verify(id, user.userId, body.comment || '');
        this.realtime.emitEvent('verification_completed', { detectionId: id, status: 'VERIFIED' });
        await this.auditService.record({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: 'DETECTION_VERIFIED',
            category: 'DETECTIONS',
            targetType: 'Detection',
            targetId: id,
            metadata: { comment: body.comment || '' },
        });
        this.mailEvents
            .dispatch('ANOMALY_VERIFIED', `Anomaly verified: ${detection?.anomalyCode || id}`, `<div style="font-family:sans-serif"><p>Detection <b>${detection?.anomalyCode}</b> (${detection?.class}) was verified by ${user.email}.</p><p>Comment: ${body.comment || '(none)'}</p></div>`, `Detection ${detection?.anomalyCode} (${detection?.class}) verified by ${user.email}.`, { detectionId: id, severity: 'INFO' })
            .catch(() => undefined);
        return { success: true, data: detection };
    }
    async reject(user, id, body) {
        const detection = await this.detectionsService.reject(id, user.userId, body.comment || '');
        this.realtime.emitEvent('verification_completed', { detectionId: id, status: 'REJECTED' });
        return { success: true, data: detection };
    }
    async review(user, id, body) {
        const detection = await this.detectionsService.needsReview(id, user.userId, body.comment || '');
        this.realtime.emitEvent('verification_completed', { detectionId: id, status: 'NEEDS_REVIEW' });
        return { success: true, data: detection };
    }
};
exports.DetectionsController = DetectionsController;
__decorate([
    (0, common_1.Get)('detections'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('class')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('riskLevel')),
    __param(6, (0, common_1.Query)('surveyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], DetectionsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('detections/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DetectionsController.prototype, "get", null);
__decorate([
    (0, common_1.Get)('detections/survey/:surveyId'),
    __param(0, (0, common_1.Param)('surveyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], DetectionsController.prototype, "bySurvey", null);
__decorate([
    (0, common_1.Post)('detections/:id/verify'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DetectionsController.prototype, "verify", null);
__decorate([
    (0, common_1.Post)('detections/:id/reject'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DetectionsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)('detections/:id/review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], DetectionsController.prototype, "review", null);
exports.DetectionsController = DetectionsController = __decorate([
    (0, swagger_1.ApiTags)('detections'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [detections_service_1.DetectionsService,
        surveys_service_1.SurveysService,
        realtime_gateway_1.RealtimeGateway,
        mail_events_service_1.MailEventsService,
        audit_service_1.AuditService])
], DetectionsController);
//# sourceMappingURL=detections.controller.js.map