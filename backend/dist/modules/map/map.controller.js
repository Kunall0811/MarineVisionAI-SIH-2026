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
exports.MapController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const surveys_service_1 = require("../surveys/surveys.service");
const detections_service_1 = require("../detections/detections.service");
let MapController = class MapController {
    constructor(surveysService, detectionsService) {
        this.surveysService = surveysService;
        this.detectionsService = detectionsService;
    }
    async assertSurveyAccess(user, surveyId) {
        const survey = await this.surveysService.findById(surveyId);
        if (user.role === 'OPERATOR' && !this.surveysService.isOperatorAssigned(survey, user.userId)) {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this survey.' },
            });
        }
        return survey;
    }
    async anomalies(user) {
        const filter = { location: { $ne: null } };
        const { items } = await this.detectionsService.findAll(filter, 1, 2000);
        return {
            success: true,
            data: {
                type: 'FeatureCollection',
                features: items.map((d) => ({
                    type: 'Feature',
                    properties: {
                        id: d._id,
                        anomalyCode: d.anomalyCode,
                        class: d.class,
                        confidence: d.finalConfidence,
                        depth: d.depth,
                        length: d.length,
                        width: d.width,
                        status: d.status,
                        riskLevel: d.riskLevel,
                        locationStatus: d.locationStatus,
                    },
                    geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
                })),
            },
        };
    }
    async route(user, surveyId) {
        const survey = await this.assertSurveyAccess(user, surveyId);
        return {
            success: true,
            data: {
                type: 'Feature',
                properties: { surveyId: survey._id, code: survey.code, dataType: survey.dataType },
                geometry: survey.route,
            },
        };
    }
    async surveyGeoJson(user, surveyId) {
        const survey = await this.assertSurveyAccess(user, surveyId);
        const detections = await this.detectionsService.findBySurvey(surveyId, { location: { $ne: null } });
        return {
            success: true,
            data: {
                type: 'FeatureCollection',
                features: [
                    {
                        type: 'Feature',
                        properties: { kind: 'survey_route', code: survey.code, dataType: survey.dataType },
                        geometry: survey.route,
                    },
                    ...detections.map((d) => ({
                        type: 'Feature',
                        properties: {
                            kind: 'anomaly',
                            id: d._id,
                            anomalyCode: d.anomalyCode,
                            class: d.class,
                            confidence: d.finalConfidence,
                            riskLevel: d.riskLevel,
                            status: d.status,
                            locationStatus: d.locationStatus,
                            depth: d.depth,
                            length: d.length,
                            width: d.width,
                        },
                        geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
                    })),
                ],
            },
        };
    }
};
exports.MapController = MapController;
__decorate([
    (0, common_1.Get)('anomalies'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MapController.prototype, "anomalies", null);
__decorate([
    (0, common_1.Get)('routes/:surveyId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('surveyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MapController.prototype, "route", null);
__decorate([
    (0, common_1.Get)('geojson/:surveyId'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('surveyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MapController.prototype, "surveyGeoJson", null);
exports.MapController = MapController = __decorate([
    (0, swagger_1.ApiTags)('map'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('map'),
    __metadata("design:paramtypes", [surveys_service_1.SurveysService,
        detections_service_1.DetectionsService])
], MapController);
//# sourceMappingURL=map.controller.js.map