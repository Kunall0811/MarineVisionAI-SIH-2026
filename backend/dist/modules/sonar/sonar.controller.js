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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonarController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const swagger_1 = require("@nestjs/swagger");
const sharp_1 = __importDefault(require("sharp"));
const multer_1 = require("multer");
const mongoose_1 = require("mongoose");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const sonar_service_1 = require("./sonar.service");
const sonar_processing_service_1 = require("./sonar-processing.service");
const surveys_service_1 = require("../surveys/surveys.service");
const storage_service_1 = require("../storage/storage.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const navigation_util_1 = require("./navigation.util");
const ALLOWED_EXTENSIONS = ['png', 'jpg', 'jpeg', 'tiff', 'xtf', 'jsf'];
const MAX_FILE_SIZE = 200 * 1024 * 1024;
function extractExtension(fileName) {
    const parts = fileName.split('.');
    return (parts[parts.length - 1] || '').toLowerCase();
}
let SonarController = class SonarController {
    constructor(sonarService, surveysService, storage, realtime, processingQueue, sonarProcessingService) {
        this.sonarService = sonarService;
        this.surveysService = surveysService;
        this.storage = storage;
        this.realtime = realtime;
        this.processingQueue = processingQueue;
        this.sonarProcessingService = sonarProcessingService;
        this.logger = new common_1.Logger('SonarController');
    }
    async assertUploadPermission(user, surveyId) {
        const survey = await this.surveysService.findById(surveyId);
        if (user.role === 'OPERATOR') {
            if (!this.surveysService.isOperatorAssigned(survey, user.userId)) {
                throw new common_1.ForbiddenException({
                    success: false,
                    error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this survey.' },
                });
            }
            if (user.operatorPermissions?.canUpload === false) {
                throw new common_1.ForbiddenException({
                    success: false,
                    error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have upload permission.' },
                });
            }
        }
        return survey;
    }
    async uploadSingle(user, surveyId, file) {
        if (!surveyId) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'SURVEY_ID_REQUIRED', message: 'surveyId is required.' },
            });
        }
        if (!file) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'FILE_REQUIRED', message: 'No file uploaded.' },
            });
        }
        const survey = await this.assertUploadPermission(user, surveyId);
        const frame = await this.storeAndQueueFrame(survey, file, user);
        return { success: true, data: frame };
    }
    async uploadBatch(user, surveyId, files) {
        if (!surveyId) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'SURVEY_ID_REQUIRED', message: 'surveyId is required.' },
            });
        }
        if (!files || !files.length) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'FILES_REQUIRED', message: 'No files uploaded.' },
            });
        }
        const survey = await this.assertUploadPermission(user, surveyId);
        const results = [];
        const errors = [];
        for (const file of files) {
            try {
                const frame = await this.storeAndQueueFrame(survey, file, user);
                results.push({ fileName: file.originalname, frameId: frame._id, status: 'QUEUED' });
            }
            catch (err) {
                errors.push({ fileName: file.originalname, status: 'SKIPPED', reason: err.message });
            }
        }
        this.realtime.emitEvent('sonar_uploaded', {
            surveyId: survey._id,
            uploaded: results.length,
            skipped: errors.length,
        });
        return {
            success: true,
            data: { queued: results.length, skipped: errors.length, results, errors },
        };
    }
    async uploadNavigationCsv(user, surveyId, file) {
        await this.assertUploadPermission(user, surveyId);
        if (!file) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'FILE_REQUIRED', message: 'No navigation.csv uploaded.' },
            });
        }
        const { byFileName, byTimestamp } = (0, navigation_util_1.parseNavigationCsv)(file.buffer.toString('utf-8'));
        let matched = 0;
        let estimated = 0;
        let page = 1;
        while (true) {
            const [frames, total] = await this.sonarService.findBySurvey(surveyId, page, 100);
            if (!frames.length)
                break;
            for (const frame of frames) {
                if (frame.navigationSource === 'REAL')
                    continue;
                const byName = byFileName.get(frame.fileName);
                if (byName) {
                    await this.sonarService.update(String(frame._id), {
                        latitude: byName.latitude,
                        longitude: byName.longitude,
                        heading: byName.heading ?? null,
                        depth: byName.depth ?? null,
                        altitude: byName.altitude ?? null,
                        heave: byName.heave ?? null,
                        pitch: byName.pitch ?? null,
                        roll: byName.roll ?? null,
                        motionCorrectionStatus: byName.heave != null || byName.pitch != null || byName.roll != null ? 'FULL' : 'PARTIAL',
                        range: byName.range ?? frame.range,
                        side: byName.side ?? frame.side,
                        navigationSource: 'REAL',
                    });
                    matched++;
                    continue;
                }
                if (frame.timestamp) {
                    const nearest = (0, navigation_util_1.findNearestByTimestamp)(byTimestamp, frame.timestamp.toISOString());
                    if (nearest) {
                        await this.sonarService.update(String(frame._id), {
                            latitude: nearest.record.latitude,
                            longitude: nearest.record.longitude,
                            heading: nearest.record.heading ?? null,
                            depth: nearest.record.depth ?? null,
                            altitude: nearest.record.altitude ?? null,
                            heave: nearest.record.heave ?? null,
                            pitch: nearest.record.pitch ?? null,
                            roll: nearest.record.roll ?? null,
                            motionCorrectionStatus: nearest.record.heave != null || nearest.record.pitch != null || nearest.record.roll != null ? 'FULL' : 'PARTIAL',
                            range: nearest.record.range ?? frame.range,
                            side: nearest.record.side ?? frame.side,
                            navigationSource: nearest.isEstimated ? 'ESTIMATED' : 'REAL',
                        });
                        nearest.isEstimated ? estimated++ : matched++;
                    }
                }
            }
            if (page * 100 >= total)
                break;
            page++;
        }
        return { success: true, data: { matched, estimated } };
    }
    async enqueueFrameSafely(frameId) {
        try {
            const addPromise = this.processingQueue.add('process-frame', { frameId });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Queue timeout')), 250));
            await Promise.race([addPromise, timeoutPromise]);
        }
        catch (err) {
            this.logger.warn(`Queue bypassed for frame ${frameId} (${err.message}); running in background`);
            setImmediate(() => {
                this.sonarProcessingService.processFrame(frameId).catch((e) => {
                    this.logger.error(`Direct frame processing error: ${e.message}`);
                });
            });
        }
    }
    async processFrame(user, id) {
        const frame = await this.sonarService.findById(id);
        const survey = await this.surveysService.findById(String(frame.surveyId));
        if (user.role === 'OPERATOR') {
            if (!this.surveysService.isOperatorAssigned(survey, user.userId)) {
                throw new common_1.ForbiddenException({
                    success: false,
                    error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this survey.' },
                });
            }
            if (user.operatorPermissions?.canProcess === false) {
                throw new common_1.ForbiddenException({
                    success: false,
                    error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'You do not have processing permission.' },
                });
            }
        }
        if (['xtf', 'jsf'].includes(frame.fileType)) {
            throw new common_1.BadRequestException({
                success: false,
                error: {
                    code: 'RAW_SONAR_PARSER_REQUIRED',
                    message: 'XTF/JSF ingestion is registered, but this build does not claim a production raw-log parser. Provide a validated parser before processing raw logs.',
                },
            });
        }
        await this.enqueueFrameSafely(id);
        return { success: true, data: { frameId: id, status: 'QUEUED' } };
    }
    async processAllForSurvey(user, surveyId) {
        const survey = await this.assertUploadPermission(user, surveyId);
        let page = 1;
        let queued = 0;
        while (true) {
            const [frames, total] = await this.sonarService.findBySurvey(String(survey._id), page, 100, {
                processingStatus: 'QUEUED',
            });
            if (!frames.length)
                break;
            for (const frame of frames) {
                await this.enqueueFrameSafely(String(frame._id));
                queued++;
            }
            if (page * 100 >= total)
                break;
            page++;
        }
        await this.surveysService.update(String(survey._id), { status: 'PROCESSING' });
        return { success: true, data: { surveyId: String(survey._id), queued } };
    }
    async listBySurvey(surveyId, page = '1', limit = '500', status) {
        let resolvedId = surveyId;
        if (!mongoose_1.Types.ObjectId.isValid(surveyId)) {
            const s = await this.surveysService.findByCode(surveyId);
            if (s)
                resolvedId = String(s._id);
        }
        const filter = {};
        if (status)
            filter.processingStatus = status;
        const [frames, total] = await this.sonarService.findBySurvey(resolvedId, parseInt(page, 10), parseInt(limit, 10), filter);
        return { success: true, data: frames, meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } };
    }
    async getFrame(id) {
        const frame = await this.sonarService.findById(id);
        return { success: true, data: frame };
    }
    async getFrameImage(id, res) {
        const frame = await this.sonarService.findById(id);
        if (!frame) {
            res.status(404).json({
                success: false,
                error: { code: 'FRAME_NOT_FOUND', message: 'Sonar frame record not found.' },
            });
            return;
        }
        if (!this.storage.exists(frame.storagePath)) {
            const noticeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="260" viewBox="0 0 800 260">
  <rect width="800" height="260" fill="#071322" stroke="#0891b2" stroke-width="2" rx="8"/>
  <circle cx="400" cy="70" r="28" fill="#0e7490" fill-opacity="0.3"/>
  <path d="M400 56v20m0 8h.01" stroke="#22d3ee" stroke-width="3" stroke-linecap="round"/>
  <text x="400" y="135" text-anchor="middle" fill="#38bdf8" font-family="sans-serif" font-size="18" font-weight="bold">
    Original sonar image not included in this deployment package.
  </text>
  <text x="400" y="170" text-anchor="middle" fill="#94a3b8" font-family="sans-serif" font-size="13">
    The original dataset image pixels were intentionally removed from this deployment package to reduce package size.
  </text>
  <text x="400" y="200" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="12">
    All AI detection metadata, YOLO annotations, bounding boxes, and model weights remain active.
  </text>
</svg>`.trim();
            res.setHeader('Content-Type', 'image/svg+xml');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.send(Buffer.from(noticeSvg, 'utf8'));
            return;
        }
        const buffer = this.storage.readFile(frame.storagePath);
        const contentType = frame.fileType === 'png' ? 'image/png' : ['jpg', 'jpeg'].includes(frame.fileType) ? 'image/jpeg' : 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'private, max-age=3600');
        res.send(buffer);
    }
    async getPreprocessedImage(id, res) {
        const frame = await this.sonarService.findById(id);
        if (!frame.preprocessedStoragePath || !this.storage.exists(frame.preprocessedStoragePath)) {
            res.status(404).json({
                success: false,
                error: { code: 'FILE_NOT_FOUND', message: 'Preprocessed image not available yet.' },
            });
            return;
        }
        const buffer = this.storage.readFile(frame.preprocessedStoragePath);
        res.setHeader('Content-Type', 'image/png');
        res.send(buffer);
    }
    async storeAndQueueFrame(survey, file, user) {
        const ext = extractExtension(file.originalname);
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            throw new common_1.BadRequestException(`Unsupported file type ".${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
        }
        const existing = await this.sonarService.findByFileNameAndSurvey(String(survey._id), file.originalname);
        if (existing) {
            throw new common_1.BadRequestException(`File "${file.originalname}" was already uploaded to this survey.`);
        }
        const { storagePath, fileHash } = await this.storage.putFile(file.buffer, survey.code, file.originalname);
        let imageWidth = null;
        let imageHeight = null;
        if (['png', 'jpg', 'jpeg', 'tiff'].includes(ext)) {
            try {
                const meta = await (0, sharp_1.default)(file.buffer).metadata();
                imageWidth = meta.width || null;
                imageHeight = meta.height || null;
            }
            catch {
            }
        }
        const frame = await this.sonarService.create({
            surveyId: survey._id,
            fileName: file.originalname,
            storagePath,
            fileHash,
            fileType: ext,
            imageWidth,
            imageHeight,
            processingStatus: 'QUEUED',
            navigationSource: 'UNAVAILABLE',
            uploadedByRole: user?.role === 'OPERATOR' ? 'OPERATOR' : 'ADMIN',
            uploadedByUserId: user?.userId || null,
            reviewStatus: user?.role === 'OPERATOR' ? 'PENDING_REVIEW' : 'APPROVED',
        });
        await this.surveysService.incrementFrameCounts(String(survey._id), { totalFrames: 1 });
        return frame;
    }
};
exports.SonarController = SonarController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: MAX_FILE_SIZE } })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('surveyId')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "uploadSingle", null);
__decorate([
    (0, common_1.Post)('batch-upload'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 2000, { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: MAX_FILE_SIZE } })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('surveyId')),
    __param(2, (0, common_1.UploadedFiles)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "uploadBatch", null);
__decorate([
    (0, common_1.Post)('navigation/:surveyId'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: (0, multer_1.memoryStorage)() })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('surveyId')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "uploadNavigationCsv", null);
__decorate([
    (0, common_1.Post)(':id/process'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "processFrame", null);
__decorate([
    (0, common_1.Post)('survey/:surveyId/process-all'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('surveyId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "processAllForSurvey", null);
__decorate([
    (0, common_1.Get)('survey/:surveyId'),
    __param(0, (0, common_1.Param)('surveyId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "listBySurvey", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "getFrame", null);
__decorate([
    (0, common_1.Get)(':id/image'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "getFrameImage", null);
__decorate([
    (0, common_1.Get)(':id/preprocessed-image'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SonarController.prototype, "getPreprocessedImage", null);
exports.SonarController = SonarController = __decorate([
    (0, swagger_1.ApiTags)('sonar'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('sonar'),
    __param(4, (0, bullmq_1.InjectQueue)('sonar-processing')),
    __metadata("design:paramtypes", [sonar_service_1.SonarService,
        surveys_service_1.SurveysService,
        storage_service_1.StorageService,
        realtime_gateway_1.RealtimeGateway,
        bullmq_2.Queue,
        sonar_processing_service_1.SonarProcessingService])
], SonarController);
//# sourceMappingURL=sonar.controller.js.map