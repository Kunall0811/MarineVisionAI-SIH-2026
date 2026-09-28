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
exports.AnomaliesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const mongoose_1 = require("mongoose");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const detections_service_1 = require("./detections.service");
const surveys_service_1 = require("../surveys/surveys.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
function mapToAnomaly(d) {
    const statusMap = {
        PENDING_REVIEW: 'needs_verification',
        NEEDS_REVIEW: 'needs_verification',
        VERIFIED: 'verified',
        REJECTED: 'rejected',
    };
    return {
        id: d._id.toString(),
        _id: d._id.toString(),
        anomalyId: d.anomalyCode,
        anomalyCode: d.anomalyCode,
        targetName: d.targetName || d.anomalyCode,
        name: d.targetName || d.anomalyCode,
        type: d.class,
        class: d.class,
        detailedType: d.detailedType || d.class,
        confidence: d.finalConfidence ?? d.confidence,
        finalConfidence: d.finalConfidence ?? d.confidence,
        shadowScore: d.shadowScore ?? 0,
        latitude: d.latitude,
        longitude: d.longitude,
        depth: d.depth,
        depthFt: d.depthFt || (d.depth != null ? `${Math.round(d.depth * 3.28084)} ft` : null),
        locationStatus: d.locationStatus || 'REAL',
        sonarEvidence: d.sonarEvidence || d.historicalSource || null,
        length: d.length,
        width: d.width,
        height: d.height,
        status: statusMap[d.status] || 'detected',
        riskLevel: d.riskLevel,
        sourceType: d.dataType?.toLowerCase(),
        coordinateSource: d.coordinateSource,
        modelVersion: d.modelVersion,
        sonarFrameId: d.sonarFrameId ? d.sonarFrameId.toString() : null,
        surveyId: d.surveyId ? d.surveyId.toString() : null,
        bbox: d.bbox || null,
        imageUrl: d.imageUrl || (d.sonarFrameId ? `/api/sonar/${d.sonarFrameId}/image` : null),
        timestamp: d.createdAt,
        createdAt: d.createdAt,
        updatedAt: d.updatedAt,
    };
}
let AnomaliesController = class AnomaliesController {
    constructor(detectionsService, surveysService, realtime, notificationsService) {
        this.detectionsService = detectionsService;
        this.surveysService = surveysService;
        this.realtime = realtime;
        this.notificationsService = notificationsService;
    }
    async list(user, page = '1', limit = '50', type, status, riskLevel, surveyId, sonarFrameId, sourceType) {
        const filter = {};
        if (sonarFrameId) {
            filter.sonarFrameId = mongoose_1.Types.ObjectId.isValid(sonarFrameId) ? new mongoose_1.Types.ObjectId(sonarFrameId) : sonarFrameId;
        }
        if (type)
            filter.class = type;
        if (status) {
            const revMap = {
                needs_verification: ['PENDING_REVIEW', 'NEEDS_REVIEW'],
                verified: ['VERIFIED'],
                rejected: ['REJECTED'],
                detected: ['PENDING_REVIEW'],
            };
            filter.status = { $in: revMap[status] || [status] };
        }
        if (riskLevel)
            filter.riskLevel = riskLevel;
        if (surveyId)
            filter.surveyId = surveyId;
        if (sourceType)
            filter.dataType = sourceType.toUpperCase();
        const { items, total } = await this.detectionsService.findAll(filter, parseInt(page, 10), parseInt(limit, 10));
        return { success: true, data: items.map(mapToAnomaly), meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } };
    }
    async listLive(page = '1', limit = '50') {
        const { items, total } = await this.detectionsService.findAll({ dataType: 'LIVE' }, parseInt(page, 10), parseInt(limit, 10));
        return { success: true, data: items.map(mapToAnomaly), meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } };
    }
    async listHistorical(page = '1', limit = '50') {
        const { items, total } = await this.detectionsService.findAll({ dataType: 'HISTORICAL' }, parseInt(page, 10), parseInt(limit, 10));
        return { success: true, data: items.map(mapToAnomaly), meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } };
    }
    async getGeoJson(sourceType) {
        const filter = {};
        if (sourceType)
            filter.dataType = sourceType.toUpperCase();
        const { items } = await this.detectionsService.findAll(filter, 1, 5000);
        const features = items.map(d => ({
            type: 'Feature',
            geometry: {
                type: 'Point',
                coordinates: [d.longitude, d.latitude],
            },
            properties: mapToAnomaly(d),
        }));
        return {
            type: 'FeatureCollection',
            features,
        };
    }
    async getNearby(lat, lon, distance = '5000') {
        if (!lat || !lon)
            throw new common_1.BadRequestException('lat and lon are required');
        const items = await this.detectionsService.findNearby(parseFloat(lon), parseFloat(lat), parseInt(distance, 10));
        return { success: true, data: items.map(mapToAnomaly) };
    }
    async get(id) {
        const detection = await this.detectionsService.findById(id);
        return { success: true, data: mapToAnomaly(detection) };
    }
    async create(user, body) {
        if (body.latitude !== undefined && (body.latitude < -90 || body.latitude > 90)) {
            throw new common_1.BadRequestException('Latitude must be between -90 and 90');
        }
        if (body.longitude !== undefined && (body.longitude < -180 || body.longitude > 180)) {
            throw new common_1.BadRequestException('Longitude must be between -180 and 180');
        }
        const doc = {
            surveyId: body.surveyId || '000000000000000000000000',
            sonarFrameId: body.sonarFrameId || '000000000000000000000000',
            anomalyCode: body.anomalyId || `ANM-SIM-${Date.now()}`,
            class: body.type,
            confidence: body.confidence,
            finalConfidence: body.confidence,
            latitude: body.latitude,
            longitude: body.longitude,
            depth: body.depth,
            length: body.length,
            width: body.width,
            height: body.height,
            riskLevel: body.riskLevel || 'LOW',
            dataType: body.sourceType ? body.sourceType.toUpperCase() : 'LIVE',
            coordinateSource: body.coordinateSource || 'SIMULATED_DEMO',
            modelVersion: body.modelVersion || 'v1.0.0-demo',
            bbox: { x1: 0, y1: 0, x2: 10, y2: 10 },
            locationStatus: 'ESTIMATED',
        };
        if (body.latitude && body.longitude) {
            doc.location = {
                type: 'Point',
                coordinates: [body.longitude, body.latitude]
            };
        }
        const created = await this.detectionsService.create(doc);
        const anomaly = mapToAnomaly(created);
        this.realtime.emitEvent('anomaly_created', anomaly);
        this.notificationsService.createForEveryone({
            type: 'ANOMALY_CREATED',
            title: `New Sonar Anomaly: ${anomaly.targetName || anomaly.anomalyId}`,
            message: `Target ${anomaly.anomalyId} (${anomaly.detailedType || anomaly.type}) at ${anomaly.latitude?.toFixed(4)}°, ${anomaly.longitude?.toFixed(4)}° plotted on 3D Globe.`,
            severity: anomaly.riskLevel === 'CRITICAL' ? 'CRITICAL' : anomaly.riskLevel === 'HIGH' ? 'HIGH' : 'INFO',
            metadata: { anomalyId: anomaly.id, anomalyCode: anomaly.anomalyId, latitude: anomaly.latitude, longitude: anomaly.longitude },
        }).catch(() => undefined);
        return { success: true, data: anomaly };
    }
    async update(user, id, body) {
        if (user.role === 'OPERATOR') {
            throw new common_1.ForbiddenException({
                success: false,
                error: {
                    code: 'INSUFFICIENT_PERMISSIONS',
                    message: 'Operators cannot verify, reject, or edit detections directly. Submit for admin review instead.',
                },
            });
        }
        const update = {};
        if (body.type)
            update.class = body.type;
        if (body.riskLevel)
            update.riskLevel = body.riskLevel;
        if (body.status) {
            const statusMap = {
                needs_verification: 'PENDING_REVIEW',
                verified: 'VERIFIED',
                rejected: 'REJECTED'
            };
            update.status = statusMap[body.status] || 'PENDING_REVIEW';
        }
        if (body.latitude !== undefined && body.latitude !== null) {
            update.latitude = Number(body.latitude);
        }
        if (body.longitude !== undefined && body.longitude !== null) {
            update.longitude = Number(body.longitude);
        }
        if (update.latitude !== undefined && update.longitude !== undefined) {
            update.location = {
                type: 'Point',
                coordinates: [update.longitude, update.latitude],
            };
            update.locationStatus = 'REAL';
            update.coordinateSource = 'SURVEY_METADATA';
        }
        if (body.depth !== undefined && body.depth !== null)
            update.depth = Number(body.depth);
        if (body.targetName)
            update.targetName = body.targetName;
        if (body.detailedType)
            update.detailedType = body.detailedType;
        if (body.bbox)
            update.bbox = body.bbox;
        const updated = await this.detectionsService.update(id, update);
        const anomaly = mapToAnomaly(updated);
        this.realtime.emitEvent('anomaly_updated', anomaly);
        if (update.latitude !== undefined || update.longitude !== undefined) {
            this.realtime.emitEvent('coordinate_updated', {
                id: anomaly.id,
                anomalyId: anomaly.anomalyId,
                latitude: anomaly.latitude,
                longitude: anomaly.longitude,
                anomaly,
            });
        }
        if (anomaly.status === 'verified') {
            this.realtime.emitEvent('anomaly_verified', anomaly);
        }
        else if (anomaly.status === 'rejected') {
            this.realtime.emitEvent('anomaly_rejected', anomaly);
        }
        const actionLabel = anomaly.status === 'verified' ? 'Verified' : anomaly.status === 'rejected' ? 'Rejected' : 'Updated';
        let notifMessage = `Admin updated anomaly ${anomaly.anomalyId} (${anomaly.detailedType || anomaly.type}) to ${anomaly.status.toUpperCase()}.`;
        if (update.latitude !== undefined && update.longitude !== undefined) {
            notifMessage = `Admin updated coordinates of ${anomaly.anomalyId} to (${anomaly.latitude?.toFixed(5)}°, ${anomaly.longitude?.toFixed(5)}°). Marker moved live on all operator globes.`;
        }
        this.notificationsService.createForEveryone({
            type: 'ANOMALY_UPDATED',
            title: `Globe Anomaly ${actionLabel}: ${anomaly.targetName || anomaly.anomalyId}`,
            message: notifMessage,
            severity: anomaly.riskLevel === 'CRITICAL' ? 'CRITICAL' : anomaly.riskLevel === 'HIGH' ? 'HIGH' : 'INFO',
            metadata: {
                anomalyId: anomaly.id,
                anomalyCode: anomaly.anomalyId,
                status: anomaly.status,
                latitude: anomaly.latitude,
                longitude: anomaly.longitude,
            },
        }).catch(() => undefined);
        return { success: true, data: anomaly };
    }
};
exports.AnomaliesController = AnomaliesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('riskLevel')),
    __param(6, (0, common_1.Query)('surveyId')),
    __param(7, (0, common_1.Query)('sonarFrameId')),
    __param(8, (0, common_1.Query)('sourceType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnomaliesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('live'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnomaliesController.prototype, "listLive", null);
__decorate([
    (0, common_1.Get)('historical'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnomaliesController.prototype, "listHistorical", null);
__decorate([
    (0, common_1.Get)('geojson'),
    __param(0, (0, common_1.Query)('sourceType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnomaliesController.prototype, "getGeoJson", null);
__decorate([
    (0, common_1.Get)('nearby'),
    __param(0, (0, common_1.Query)('lat')),
    __param(1, (0, common_1.Query)('lon')),
    __param(2, (0, common_1.Query)('distance')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AnomaliesController.prototype, "getNearby", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnomaliesController.prototype, "get", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnomaliesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AnomaliesController.prototype, "update", null);
exports.AnomaliesController = AnomaliesController = __decorate([
    (0, swagger_1.ApiTags)('anomalies'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('anomalies'),
    __metadata("design:paramtypes", [detections_service_1.DetectionsService,
        surveys_service_1.SurveysService,
        realtime_gateway_1.RealtimeGateway,
        notifications_service_1.NotificationsService])
], AnomaliesController);
//# sourceMappingURL=anomalies.controller.js.map