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
exports.GlobeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const surveys_service_1 = require("../surveys/surveys.service");
const detections_service_1 = require("../detections/detections.service");
const water_bodies_service_1 = require("../water-bodies/water-bodies.service");
const historical_service_1 = require("../historical/historical.service");
let GlobeController = class GlobeController {
    constructor(surveysService, detectionsService, waterBodiesService, historicalService) {
        this.surveysService = surveysService;
        this.detectionsService = detectionsService;
        this.waterBodiesService = waterBodiesService;
        this.historicalService = historicalService;
    }
    async surveys(user) {
        const filter = {};
        if (user.role === 'OPERATOR')
            filter.assignedOperators = user.userId;
        const { items } = await this.surveysService.findAll(filter, 1, 500);
        return {
            success: true,
            data: items.map((s) => ({
                id: s._id,
                code: s.code,
                name: s.name,
                status: s.status,
                dataType: s.dataType,
                waterBodyName: s.waterBodyName,
                region: s.region,
                totalFrames: s.totalFrames,
                processedFrames: s.processedFrames,
                route: s.route,
            })),
        };
    }
    async anomalies(surveyId, riskLevel, dataType, klass) {
        const filter = { location: { $ne: null } };
        if (surveyId)
            filter.surveyId = surveyId;
        if (riskLevel)
            filter.riskLevel = riskLevel;
        if (dataType)
            filter.dataType = dataType;
        if (klass)
            filter.class = klass;
        const { items } = await this.detectionsService.findAll(filter, 1, 2000);
        return {
            success: true,
            data: items.map((d) => ({
                id: d._id,
                anomalyCode: d.anomalyCode,
                targetName: d.targetName || d.anomalyCode,
                name: d.targetName || d.anomalyCode,
                surveyId: d.surveyId,
                class: d.class,
                type: d.class,
                detailedType: d.detailedType || d.class,
                confidence: d.finalConfidence,
                latitude: d.latitude,
                longitude: d.longitude,
                depth: d.depth,
                depthFt: d.depthFt || (d.depth != null ? `${Math.round(d.depth * 3.28084)} ft` : null),
                sonarEvidence: d.sonarEvidence || d.historicalSource,
                riskLevel: d.riskLevel,
                status: d.status,
                locationStatus: d.locationStatus,
                dataType: d.dataType,
                historicalSource: d.historicalSource,
            })),
        };
    }
    async waterBodies(type) {
        const filter = {};
        if (type)
            filter.type = type;
        const items = await this.waterBodiesService.findAll(filter);
        return {
            success: true,
            data: {
                type: 'FeatureCollection',
                features: items.map((w) => ({
                    type: 'Feature',
                    properties: { id: w._id, name: w.name, type: w.type, region: w.region, source: w.source },
                    geometry: w.geometry,
                })),
            },
        };
    }
    async layers() {
        const [waterBodyCount, detectionStats] = await Promise.all([
            this.waterBodiesService.count(),
            this.detectionsService.globalStatistics(),
        ]);
        return {
            success: true,
            data: {
                waterBodies: waterBodyCount,
                classes: detectionStats.byClass,
                riskLevels: detectionStats.byRisk,
            },
        };
    }
    async historicalReference(type, fromYear, toYear, search) {
        const data = await this.historicalService.list({
            type,
            fromYear: fromYear ? Number(fromYear) : undefined,
            toYear: toYear ? Number(toYear) : undefined,
            search,
        });
        return {
            success: true,
            data,
            meta: {
                source: 'MongoDB historical_references',
                dataStatus: 'HISTORICAL_REFERENCE',
                note: 'Documented historical records; not AI detections and not current sonar observations.',
            },
        };
    }
    async historical(surveyId) {
        const filter = { dataType: 'HISTORICAL', location: { $ne: null } };
        if (surveyId)
            filter.surveyId = surveyId;
        const { items } = await this.detectionsService.findAll(filter, 1, 2000);
        return {
            success: true,
            data: items.map((d) => ({
                id: d._id,
                anomalyCode: d.anomalyCode,
                class: d.class,
                latitude: d.latitude,
                longitude: d.longitude,
                historicalSource: d.historicalSource,
                dataType: d.dataType,
            })),
        };
    }
};
exports.GlobeController = GlobeController;
__decorate([
    (0, common_1.Get)('surveys'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], GlobeController.prototype, "surveys", null);
__decorate([
    (0, common_1.Get)('anomalies'),
    __param(0, (0, common_1.Query)('surveyId')),
    __param(1, (0, common_1.Query)('riskLevel')),
    __param(2, (0, common_1.Query)('dataType')),
    __param(3, (0, common_1.Query)('class')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], GlobeController.prototype, "anomalies", null);
__decorate([
    (0, common_1.Get)('water-bodies'),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GlobeController.prototype, "waterBodies", null);
__decorate([
    (0, common_1.Get)('layers'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GlobeController.prototype, "layers", null);
__decorate([
    (0, common_1.Get)('historical-reference'),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('fromYear')),
    __param(2, (0, common_1.Query)('toYear')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], GlobeController.prototype, "historicalReference", null);
__decorate([
    (0, common_1.Get)('historical'),
    __param(0, (0, common_1.Query)('surveyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], GlobeController.prototype, "historical", null);
exports.GlobeController = GlobeController = __decorate([
    (0, swagger_1.ApiTags)('globe'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('globe'),
    __metadata("design:paramtypes", [surveys_service_1.SurveysService,
        detections_service_1.DetectionsService,
        water_bodies_service_1.WaterBodiesService,
        historical_service_1.HistoricalService])
], GlobeController);
//# sourceMappingURL=globe.controller.js.map