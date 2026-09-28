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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const surveys_service_1 = require("../surveys/surveys.service");
const detections_service_1 = require("../detections/detections.service");
const ai_inference_service_1 = require("../ai-inference/ai-inference.service");
const config_1 = require("@nestjs/config");
let DashboardController = class DashboardController {
    constructor(surveysService, detectionsService, aiInference, config, mongoConnection, processingQueue) {
        this.surveysService = surveysService;
        this.detectionsService = detectionsService;
        this.aiInference = aiInference;
        this.config = config;
        this.mongoConnection = mongoConnection;
        this.processingQueue = processingQueue;
    }
    async summary() {
        const [{ items: activeSurveys, total: activeSurveyCount }, stats, queueCounts] = await Promise.all([
            this.surveysService.findAll({ status: { $in: ['ACTIVE', 'PROCESSING'] } }, 1, 1),
            this.detectionsService.globalStatistics(),
            this.processingQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
        ]);
        const classCounts = Object.fromEntries(stats.byClass.map((c) => [c._id, c.count]));
        const statusCounts = Object.fromEntries(stats.byStatus.map((c) => [c._id, c.count]));
        const riskCounts = Object.fromEntries(stats.byRisk.map((c) => [c._id, c.count]));
        return {
            success: true,
            data: {
                activeSurveys: activeSurveyCount,
                totalDetections: stats.total,
                highRiskAnomalies: stats.highRisk,
                verifiedDetections: statusCounts['VERIFIED'] || 0,
                pendingReviews: statusCounts['PENDING_REVIEW'] || 0,
                byClass: {
                    ghostNets: classCounts['ghost_net'] || 0,
                    containers: classCounts['container'] || 0,
                    pipes: classCounts['pipe'] || 0,
                    shipwrecks: classCounts['shipwreck'] || 0,
                    marineDebris: classCounts['marine_debris'] || 0,
                    unknownAnomalies: classCounts['unknown_anomaly'] || 0,
                },
                processingQueue: queueCounts,
                source: 'MongoDB (live aggregation) + BullMQ queue state',
            },
        };
    }
    async systemHealth() {
        const dbState = this.mongoConnection.readyState;
        let queueOk = true;
        try {
            await this.processingQueue.getJobCounts();
        }
        catch {
            queueOk = false;
        }
        return {
            success: true,
            data: {
                aiEngine: {
                    status: 'ONLINE',
                    modelVersion: this.aiInference.modelVersion,
                    mode: this.aiInference.isUsingPlaceholder() ? 'PLACEHOLDER_HEURISTIC' : 'ONNX_MODEL',
                },
                database: { status: dbState === 1 ? 'ONLINE' : 'DEGRADED', readyState: dbState },
                storage: { status: 'ONLINE', driver: this.config.get('storage.driver') },
                queue: { status: queueOk ? 'ONLINE' : 'DEGRADED' },
                emailService: { status: this.config.get('smtp.configured') ? 'CONFIGURED' : 'NOT_CONFIGURED' },
                checkedAt: new Date().toISOString(),
            },
        };
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('summary'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "summary", null);
__decorate([
    (0, common_1.Get)('system-health'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "systemHealth", null);
exports.DashboardController = DashboardController = __decorate([
    (0, swagger_1.ApiTags)('dashboard'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('dashboard'),
    __param(4, (0, mongoose_1.InjectConnection)()),
    __param(5, (0, bullmq_1.InjectQueue)('sonar-processing')),
    __metadata("design:paramtypes", [surveys_service_1.SurveysService,
        detections_service_1.DetectionsService,
        ai_inference_service_1.AiInferenceService,
        config_1.ConfigService,
        mongoose_2.Connection,
        bullmq_2.Queue])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map