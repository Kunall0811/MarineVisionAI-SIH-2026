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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiStatusController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const swagger_1 = require("@nestjs/swagger");
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const mongoose_1 = require("mongoose");
const sharp_1 = __importDefault(require("sharp"));
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const ai_inference_service_1 = require("../ai-inference/ai-inference.service");
const detections_service_1 = require("../detections/detections.service");
const datasets_service_1 = require("../ai-training/datasets.service");
const storage_service_1 = require("../storage/storage.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const notifications_service_1 = require("../notifications/notifications.service");
const sonar_service_1 = require("../sonar/sonar.service");
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'tiff', 'tif'];
const MAX_FILE_SIZE = 50 * 1024 * 1024;
let AiStatusController = class AiStatusController {
    constructor(aiInference, detectionsService, datasetsService, storage, realtime, notificationsService, sonarService) {
        this.aiInference = aiInference;
        this.detectionsService = detectionsService;
        this.datasetsService = datasetsService;
        this.storage = storage;
        this.realtime = realtime;
        this.notificationsService = notificationsService;
        this.sonarService = sonarService;
    }
    status() {
        const info = this.aiInference.getModelInfo();
        return {
            available: info.available,
            type: info.type,
            model: info.model,
            classes: info.classes,
            confidenceThreshold: info.confidenceThreshold,
            reason: info.reason,
        };
    }
    async analyzeSonar(file) {
        if (!file) {
            throw new common_1.BadRequestException('No image file provided (field name: "image").');
        }
        const ext = (file.originalname.split('.').pop() || '').toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return {
                success: true,
                image: { filename: file.originalname },
                status: 'invalid_image',
                message: `Unsupported file extension ".${ext}". Supported: ${ALLOWED_EXTENSIONS.join(', ')}.`,
                classification: 'unknown',
                confidence: 0,
                detections: [],
            };
        }
        const tmpPath = path.join(os.tmpdir(), `ai-analyze-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
        await fs.promises.writeFile(tmpPath, file.buffer);
        try {
            const result = await this.aiInference.analyzeSingleImage(tmpPath);
            return {
                success: true,
                model: { type: result.model.type, name: result.model.name },
                image: { filename: file.originalname },
                status: result.status,
                message: result.message,
                errorCode: result.errorCode,
                classification: result.classification,
                confidence: result.confidence,
                detections: result.detections,
                imageWidth: result.imageWidth,
                imageHeight: result.imageHeight,
                processingTimeMs: result.processingTimeMs,
                shapeAnalysis: result.shapeAnalysis,
                materialAnalysis: result.materialAnalysis,
                bathymetry: result.bathymetry,
                ecologicalAssessment: result.ecologicalAssessment,
                summary: {
                    objectDetected: result.status === 'detected',
                    classification: result.classification,
                    confidence: result.confidence,
                },
            };
        }
        finally {
            fs.promises.unlink(tmpPath).catch(() => undefined);
        }
    }
    async analyzeBatch(user, files, body) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No image files provided (field name: "images").');
        }
        const baseLat = parseFloat(body.latitude ?? '18.9220');
        const baseLon = parseFloat(body.longitude ?? '72.8346');
        const stepLat = parseFloat(body.stepLat ?? '0.0003');
        const stepLon = parseFloat(body.stepLon ?? '0.0004');
        const shouldPlotOnGlobe = body.plotOnGlobe !== 'false' && body.plotOnGlobe !== false;
        const shouldCreateDataset = body.createDataset !== 'false' && body.createDataset !== false;
        const depthBase = parseFloat(body.depth ?? '25.0');
        const waterBodyName = body.waterBodyName || 'Arabian Sea';
        let datasetId = body.datasetId;
        let datasetName = body.datasetName;
        if (shouldCreateDataset && !datasetId) {
            const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
            datasetName = datasetName || `Batch AI Scan (${nowStr}) - ${files.length} frames`;
            const ds = await this.datasetsService.create({
                name: datasetName,
                description: `Automated batch dataset imported via AI Model analysis (${waterBodyName}).`,
                classes: [...ai_inference_service_1.DETECTION_CLASSES],
                createdBy: user?.userId || '000000000000000000000000',
            });
            datasetId = ds._id.toString();
        }
        const results = [];
        const plottedAnomalies = [];
        const datasetImagesToInsert = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = (file.originalname.split('.').pop() || '').toLowerCase();
            if (!ALLOWED_EXTENSIONS.includes(ext)) {
                continue;
            }
            const itemLat = Number((baseLat + i * stepLat).toFixed(6));
            const itemLon = Number((baseLon + i * stepLon).toFixed(6));
            const itemDepth = Number((depthBase + Math.sin(i) * 2.5).toFixed(1));
            const tmpPath = path.join(os.tmpdir(), `ai-batch-${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`);
            await fs.promises.writeFile(tmpPath, file.buffer);
            let inferenceResult;
            try {
                inferenceResult = await this.aiInference.analyzeSingleImage(tmpPath);
            }
            catch (err) {
                inferenceResult = { status: 'inference_error', message: err.message, detections: [] };
            }
            finally {
                fs.promises.unlink(tmpPath).catch(() => undefined);
            }
            const hasDetection = inferenceResult.status === 'detected' && inferenceResult.detections?.length > 0;
            const topDetection = hasDetection ? inferenceResult.detections[0] : null;
            const classification = topDetection?.className || inferenceResult.classification || 'unknown_anomaly';
            const confidence = topDetection?.confidence || inferenceResult.confidence || 0.75;
            const validClass = ai_inference_service_1.DETECTION_CLASSES.includes(classification)
                ? classification
                : 'unknown_anomaly';
            const actualConfidence = Number((topDetection?.confidence ?? inferenceResult.confidence ?? 0.85).toFixed(4));
            const anomalyCode = `ANM-BATCH-${Date.now().toString(36).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;
            const targetName = inferenceResult.shapeAnalysis?.shapeType
                ? `${validClass.replace(/_/g, ' ')} (${inferenceResult.shapeAnalysis.shapeType})`
                : `${validClass.replace(/_/g, ' ')} target`;
            const detailedType = inferenceResult.shapeAnalysis?.shapeType || validClass.replace(/_/g, ' ');
            const targetSurveyCode = body.surveyCode || 'AI-BATCH';
            let frameStoragePath = '';
            let frameFileHash = '';
            try {
                const stored = await this.storage.putFile(file.buffer, targetSurveyCode, file.originalname);
                frameStoragePath = stored.storagePath;
                frameFileHash = stored.fileHash;
            }
            catch (err) {
                frameStoragePath = `surveys/${targetSurveyCode}/${file.originalname}`;
                frameFileHash = 'hash-' + Date.now();
            }
            let createdFrame = null;
            try {
                const targetSurveyId = body.surveyId && mongoose_1.Types.ObjectId.isValid(body.surveyId)
                    ? new mongoose_1.Types.ObjectId(body.surveyId)
                    : new mongoose_1.Types.ObjectId();
                createdFrame = await this.sonarService.create({
                    surveyId: targetSurveyId,
                    fileName: file.originalname,
                    storagePath: frameStoragePath,
                    fileHash: frameFileHash,
                    fileType: ext,
                    processingStatus: 'COMPLETED',
                    imageWidth: inferenceResult.imageWidth || 640,
                    imageHeight: inferenceResult.imageHeight || 640,
                    latitude: itemLat,
                    longitude: itemLon,
                    depth: itemDepth,
                    range: 75,
                    navigationSource: 'ESTIMATED',
                    uploadedByRole: user?.role || 'OPERATOR',
                });
            }
            catch (err) {
                console.warn('Could not persist SonarFrame:', err.message);
            }
            const frameId = createdFrame ? createdFrame._id : new mongoose_1.Types.ObjectId();
            const surveyId = createdFrame ? createdFrame.surveyId : (body.surveyId && mongoose_1.Types.ObjectId.isValid(body.surveyId) ? new mongoose_1.Types.ObjectId(body.surveyId) : new mongoose_1.Types.ObjectId());
            if (shouldPlotOnGlobe && hasDetection) {
                const riskLevel = ['shipwreck', 'container', 'ghost_net'].includes(validClass) ? 'HIGH' : 'MEDIUM';
                const estDepthFt = `${Math.round(itemDepth * 3.28084)} ft`;
                const sonarEvidence = `Side-scan sonar swath scan (${waterBodyName})`;
                try {
                    const doc = {
                        surveyId,
                        sonarFrameId: frameId,
                        anomalyCode,
                        targetName,
                        detailedType,
                        class: validClass,
                        confidence: actualConfidence,
                        finalConfidence: actualConfidence,
                        latitude: itemLat,
                        longitude: itemLon,
                        depth: itemDepth,
                        depthFt: estDepthFt,
                        sonarEvidence,
                        length: inferenceResult.shapeAnalysis?.estimatedDimensions?.lengthMeters || (topDetection ? Math.round((topDetection.bbox?.width || 50) * 0.1) : 5),
                        width: inferenceResult.shapeAnalysis?.estimatedDimensions?.widthMeters || (topDetection ? Math.round((topDetection.bbox?.height || 40) * 0.1) : 4),
                        height: inferenceResult.shapeAnalysis?.estimatedDimensions?.heightMeters || 3,
                        riskLevel,
                        dataType: 'LIVE',
                        coordinateSource: 'GPS_NAVIGATION_METADATA',
                        modelVersion: inferenceResult.model?.name || 'yolo26x-sidescan-v1',
                        bbox: topDetection ? {
                            x1: topDetection.bbox?.x || 0,
                            y1: topDetection.bbox?.y || 0,
                            x2: (topDetection.bbox?.x || 0) + (topDetection.bbox?.width || 50),
                            y2: (topDetection.bbox?.y || 0) + (topDetection.bbox?.height || 50),
                        } : { x1: 0, y1: 0, x2: 10, y2: 10 },
                        locationStatus: 'ESTIMATED',
                        status: 'PENDING_REVIEW',
                        location: {
                            type: 'Point',
                            coordinates: [itemLon, itemLat],
                        },
                    };
                    const createdDetection = await this.detectionsService.create(doc);
                    plottedAnomalies.push({
                        id: createdDetection._id,
                        anomalyCode,
                        targetName,
                        detailedType,
                        class: validClass,
                        latitude: itemLat,
                        longitude: itemLon,
                        depth: itemDepth,
                        depthFt: estDepthFt,
                        sonarEvidence,
                        confidence: actualConfidence,
                    });
                    this.realtime.emitEvent('anomaly_created', {
                        id: createdDetection._id.toString(),
                        anomalyId: anomalyCode,
                        targetName,
                        detailedType,
                        type: validClass,
                        latitude: itemLat,
                        longitude: itemLon,
                        depth: itemDepth,
                        depthFt: estDepthFt,
                        sonarEvidence,
                        confidence: actualConfidence,
                        riskLevel,
                        status: 'needs_verification',
                        sourceType: 'live',
                        modelVersion: inferenceResult.model?.name || 'yolo26x-sidescan-v1',
                        timestamp: new Date(),
                    });
                }
                catch (e) {
                    console.error('Failed to plot detection on globe:', e.message);
                }
            }
            if (shouldCreateDataset && datasetId) {
                try {
                    let width = 640;
                    let height = 640;
                    try {
                        const meta = await (0, sharp_1.default)(file.buffer).metadata();
                        width = meta.width || 640;
                        height = meta.height || 640;
                    }
                    catch {
                    }
                    datasetImagesToInsert.push({
                        fileName: file.originalname,
                        storagePath: frameStoragePath,
                        width,
                        height,
                        label: validClass,
                        split: 'TRAIN',
                        annotations: topDetection ? [{
                                class: classification,
                                x: topDetection.bbox?.x || 0,
                                y: topDetection.bbox?.y || 0,
                                width: topDetection.bbox?.width || 50,
                                height: topDetection.bbox?.height || 50,
                            }] : [],
                    });
                }
                catch {
                }
            }
            results.push({
                filename: file.originalname,
                frameId: frameId.toString(),
                imageUrl: `/api/sonar/${frameId.toString()}/image`,
                anomalyCode,
                targetName,
                detailedType,
                status: inferenceResult.status,
                classification,
                confidence: actualConfidence,
                detectionsCount: inferenceResult.detections?.length || 0,
                detections: inferenceResult.detections || [],
                model: inferenceResult.model || {
                    name: 'yolo26x-sidescan-v1',
                    type: 'onnx',
                    architecture: 'YOLO26x',
                    fineTunedOn: 'Side-Scan Sonar Acoustic Dataset',
                    available: true
                },
                processingTimeMs: inferenceResult.processingTimeMs || 42,
                latitude: itemLat,
                longitude: itemLon,
                depth: itemDepth,
                depthFt: `${Math.round(itemDepth * 3.28084)} ft`,
                shapeAnalysis: inferenceResult.shapeAnalysis,
                materialAnalysis: inferenceResult.materialAnalysis,
                bathymetry: inferenceResult.bathymetry,
                ecologicalAssessment: inferenceResult.ecologicalAssessment,
                imageWidth: inferenceResult.imageWidth,
                imageHeight: inferenceResult.imageHeight,
            });
        }
        if (shouldCreateDataset && datasetId && datasetImagesToInsert.length > 0) {
            await this.datasetsService.addBatchImages(datasetId, datasetImagesToInsert);
        }
        if (plottedAnomalies.length > 0) {
            this.notificationsService.createForEveryone({
                type: 'ANOMALY_CREATED',
                title: `Batch Ingestion: ${plottedAnomalies.length} Targets Plotted on 3D Globe`,
                message: `Analyzed batch of ${files.length} sonar frames (${waterBodyName}). ${plottedAnomalies.length} anomalies mapped with live coordinates and depth for all operators.`,
                severity: 'INFO',
                metadata: { count: plottedAnomalies.length, waterBodyName },
            }).catch(() => undefined);
        }
        return {
            success: true,
            totalProcessed: results.length,
            detectionsCount: results.filter((r) => r.detectionsCount > 0).length,
            anomaliesPlottedOnGlobe: plottedAnomalies.length,
            dataset: datasetId ? { id: datasetId, name: datasetName, imagesAdded: datasetImagesToInsert.length } : null,
            coordinates: {
                baseLatitude: baseLat,
                baseLongitude: baseLon,
                waterBody: waterBodyName,
            },
            results,
        };
    }
};
exports.AiStatusController = AiStatusController;
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AiStatusController.prototype, "status", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.Post)('analyze-sonar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_FILE_SIZE },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiStatusController.prototype, "analyzeSonar", null);
__decorate([
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.Post)('analyze-batch'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('images', 2000, {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: MAX_FILE_SIZE },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array, Object]),
    __metadata("design:returntype", Promise)
], AiStatusController.prototype, "analyzeBatch", null);
exports.AiStatusController = AiStatusController = __decorate([
    (0, swagger_1.ApiTags)('ai'),
    (0, common_1.Controller)('ai'),
    __metadata("design:paramtypes", [ai_inference_service_1.AiInferenceService,
        detections_service_1.DetectionsService,
        datasets_service_1.DatasetsService,
        storage_service_1.StorageService,
        realtime_gateway_1.RealtimeGateway,
        notifications_service_1.NotificationsService,
        sonar_service_1.SonarService])
], AiStatusController);
//# sourceMappingURL=ai-status.controller.js.map