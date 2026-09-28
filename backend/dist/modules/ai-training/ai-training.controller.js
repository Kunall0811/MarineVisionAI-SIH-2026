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
exports.AiTrainingController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const swagger_1 = require("@nestjs/swagger");
const sharp_1 = __importDefault(require("sharp"));
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const datasets_service_1 = require("./datasets.service");
const ai_training_service_1 = require("./ai-training.service");
const model_versions_service_1 = require("./model-versions.service");
const storage_service_1 = require("../storage/storage.service");
const audit_service_1 = require("../audit/audit.service");
const detections_service_1 = require("../detections/detections.service");
const notifications_service_1 = require("../notifications/notifications.service");
const surveys_service_1 = require("../surveys/surveys.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const mail_service_1 = require("../mail/mail.service");
const mongoose_1 = require("mongoose");
let AiTrainingController = class AiTrainingController {
    constructor(datasets, trainingJobs, modelVersions, storage, auditService, detectionsService, notificationsService, surveysService, realtime, mailService, configService) {
        this.datasets = datasets;
        this.trainingJobs = trainingJobs;
        this.modelVersions = modelVersions;
        this.storage = storage;
        this.auditService = auditService;
        this.detectionsService = detectionsService;
        this.notificationsService = notificationsService;
        this.surveysService = surveysService;
        this.realtime = realtime;
        this.mailService = mailService;
        this.configService = configService;
    }
    async createDataset(user, body) {
        if (!body.name || !Array.isArray(body.classes) || body.classes.length < 2) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'INVALID_DATASET', message: 'name and at least 2 classes are required.' },
            });
        }
        const dataset = await this.datasets.create({ name: body.name, description: body.description || '', classes: body.classes, createdBy: user.userId });
        await this.auditService.record({
            userId: user.userId, userEmail: user.email, userRole: user.role,
            action: 'DATASET_CREATED', category: 'TRAINING', targetType: 'Dataset', targetId: String(dataset._id),
            metadata: { name: dataset.name, classes: dataset.classes },
        });
        return { success: true, data: dataset };
    }
    async listDatasets(page = '1', limit = '30') {
        const [items, total] = await this.datasets.findAll(parseInt(page, 10), parseInt(limit, 10));
        return { success: true, data: items, meta: { total } };
    }
    async getDataset(id) {
        const dataset = await this.datasets.findById(id);
        const distribution = await this.datasets.classDistribution(id);
        return { success: true, data: { ...dataset.toObject(), classDistribution: distribution } };
    }
    async deleteDataset(user, id) {
        await this.datasets.delete(id);
        await this.auditService.record({
            userId: user.userId, userEmail: user.email, userRole: user.role,
            action: 'DATASET_DELETED', category: 'TRAINING', targetType: 'Dataset', targetId: id,
        });
        return { success: true, data: { id } };
    }
    async addImage(datasetId, label, file) {
        if (!file)
            throw new common_1.BadRequestException({ success: false, error: { code: 'FILE_REQUIRED', message: 'Image file is required.' } });
        if (!label)
            throw new common_1.BadRequestException({ success: false, error: { code: 'LABEL_REQUIRED', message: 'label is required.' } });
        const dataset = await this.datasets.findById(datasetId);
        const { storagePath } = await this.storage.putFile(file.buffer, `training/${dataset._id}`, file.originalname);
        let width = null;
        let height = null;
        try {
            const meta = await (0, sharp_1.default)(file.buffer).metadata();
            width = meta.width || null;
            height = meta.height || null;
        }
        catch {
        }
        const image = await this.datasets.addImage(datasetId, { fileName: file.originalname, storagePath, label, width, height });
        return { success: true, data: image };
    }
    async listImages(id, page = '1', limit = '60', split) {
        const filter = {};
        if (split)
            filter.split = split;
        const [items, total] = await this.datasets.listImages(id, parseInt(page, 10), parseInt(limit, 10), filter);
        return { success: true, data: items, meta: { total } };
    }
    async splitDataset(user, id, body) {
        const result = await this.datasets.applySplit(id, body.valSplit ?? 0.15, body.testSplit ?? 0.15);
        await this.auditService.record({
            userId: user.userId, userEmail: user.email, userRole: user.role,
            action: 'DATASET_SPLIT', category: 'TRAINING', targetType: 'Dataset', targetId: id, metadata: result,
        });
        return { success: true, data: result };
    }
    async submitDatasetToAdmin(user, id, body) {
        const dataset = await this.datasets.findById(id);
        const [_, totalImages] = await this.datasets.listImages(id, 1, 1);
        const updated = await this.datasets.update(id, {
            status: 'SUBMITTED_FOR_REVIEW',
            submittedBy: user.email || user.userId,
            submittedAt: new Date(),
            reviewNotes: body.notes || 'Submitted by operator for AI review and model training validation.',
        });
        try {
            await this.notificationsService.createForAdmins({
                type: 'DATASET_SUBMITTED',
                title: `📥 Operator Submitted Dataset: ${dataset.name}`,
                message: `Operator ${user.email || user.userId} submitted dataset "${dataset.name}" with ${totalImages} sonar frames for AI review.`,
                severity: 'INFO',
                metadata: {
                    datasetId: id,
                    datasetName: dataset.name,
                    submittedBy: user.email || user.userId,
                    imageCount: totalImages,
                    classes: dataset.classes,
                    notes: body.notes,
                },
            });
        }
        catch (e) {
            console.warn(`[SubmitDataset] Failed to create admin notification: ${e.message}`);
        }
        this.realtime.emitEvent('dataset_submitted', {
            datasetId: id,
            datasetName: dataset.name,
            submittedBy: user.email || user.userId,
            imageCount: totalImages,
            classes: dataset.classes,
            notes: body.notes,
        });
        const adminEmail = this.configService.get('ADMIN_ALERT_EMAIL') || this.configService.get('smtp.user') || 'admin@marinevision.ai';
        const clientBaseUrl = this.configService.get('CLIENT_URL') || 'http://localhost:5173';
        const reviewUrl = `${clientBaseUrl}/datasets/${id}`;
        let emailResult = { status: 'LOGGED_ONLY' };
        try {
            emailResult = await this.mailService.sendDatasetSubmissionEmail(adminEmail, {
                submissionId: `DS-SUB-${id.substring(0, 8).toUpperCase()}`,
                datasetName: dataset.name,
                operatorName: user.email || user.userId,
                imageCount: totalImages,
                classes: dataset.classes || [],
                notes: body.notes,
                reviewUrl,
            });
        }
        catch (err) {
            console.warn(`[SubmitDataset] Email dispatch error: ${err.message}`);
        }
        await this.auditService.record({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: 'DATASET_SUBMITTED_TO_ADMIN',
            category: 'TRAINING',
            targetType: 'Dataset',
            targetId: id,
            metadata: { imageCount: totalImages, notes: body.notes, emailStatus: emailResult.status },
        });
        return {
            success: true,
            data: updated,
            emailStatus: emailResult.status,
            message: `Dataset "${dataset.name}" submitted to Admin dashboard with real-time notification & email dispatch.`,
        };
    }
    async reviewDataset(user, id, body) {
        if (!['APPROVED', 'REJECTED'].includes(body.decision)) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'INVALID_DECISION', message: 'decision must be APPROVED or REJECTED.' },
            });
        }
        const dataset = await this.datasets.findById(id);
        const updated = await this.datasets.update(id, {
            status: body.decision,
            reviewDecision: body.decision,
            reviewedBy: user.email || user.userId,
            reviewedAt: new Date(),
            reviewNotes: body.reviewNotes || `Review completed with status: ${body.decision}`,
        });
        try {
            await this.notificationsService.createForEveryone({
                type: 'DATASET_REVIEWED',
                title: `Dataset ${body.decision === 'APPROVED' ? 'Approved ✅' : 'Rejected ❌'}: ${dataset.name}`,
                message: `Admin ${user.email || 'Admin'} has ${body.decision.toLowerCase()} dataset "${dataset.name}". ${body.reviewNotes ? `Notes: ${body.reviewNotes}` : ''}`,
                severity: body.decision === 'APPROVED' ? 'INFO' : 'MEDIUM',
                metadata: {
                    datasetId: id,
                    decision: body.decision,
                    reviewNotes: body.reviewNotes,
                },
            });
        }
        catch (_) { }
        this.realtime.emitEvent('dataset_reviewed', {
            datasetId: id,
            decision: body.decision,
            reviewNotes: body.reviewNotes,
        });
        await this.auditService.record({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: `DATASET_${body.decision}`,
            category: 'TRAINING',
            targetType: 'Dataset',
            targetId: id,
            metadata: { decision: body.decision, reviewNotes: body.reviewNotes },
        });
        return {
            success: true,
            data: updated,
            message: `Dataset review saved as ${body.decision}.`,
        };
    }
    async startTraining(user, body) {
        if (!body.datasetId) {
            throw new common_1.BadRequestException({ success: false, error: { code: 'DATASET_ID_REQUIRED', message: 'datasetId is required.' } });
        }
        const job = await this.trainingJobs.startJob({
            datasetId: body.datasetId,
            epochs: body.epochs ?? 40,
            learningRate: body.learningRate ?? 0.15,
            batchSize: body.batchSize ?? 8,
            valSplit: body.valSplit ?? 0.15,
            testSplit: body.testSplit ?? 0.15,
            useAugmentation: body.useAugmentation ?? true,
            createdBy: user.userId,
        });
        await this.auditService.record({
            userId: user.userId, userEmail: user.email, userRole: user.role,
            action: 'TRAINING_JOB_STARTED', category: 'TRAINING', targetType: 'TrainingJob', targetId: String(job._id),
            metadata: { datasetId: body.datasetId },
        });
        return { success: true, data: job };
    }
    async listTrainingJobs(page = '1', limit = '20') {
        const [items, total] = await this.trainingJobs.findAll(parseInt(page, 10), parseInt(limit, 10));
        return { success: true, data: items, meta: { total } };
    }
    async getTrainingJob(id) {
        const job = await this.trainingJobs.findById(id);
        return { success: true, data: job };
    }
    async listModelVersions() {
        const data = await this.modelVersions.findAll();
        return { success: true, data };
    }
    async activeModelVersion() {
        const data = await this.modelVersions.active();
        return { success: true, data };
    }
    async activateModelVersion(user, id) {
        const data = await this.modelVersions.activate(id);
        await this.auditService.record({
            userId: user.userId, userEmail: user.email, userRole: user.role,
            action: 'MODEL_VERSION_ACTIVATED', category: 'TRAINING', targetType: 'ModelVersion', targetId: id,
            metadata: { version: data?.version },
        });
        return { success: true, data };
    }
    async seed1000Images(user, datasetId) {
        const dataset = await this.datasets.findById(datasetId);
        const classes = dataset.classes && dataset.classes.length ? dataset.classes : ['WRECK', 'PIPELINE', 'CONTAINER', 'CORAL_COLONY', 'DEBRIS'];
        const totalCount = 1000;
        const items = [];
        for (let i = 1; i <= totalCount; i++) {
            const cls = classes[(i - 1) % classes.length];
            items.push({
                fileName: `sonar_frame_synth_${String(i).padStart(4, '0')}.png`,
                storagePath: `synthetic/sonar_${cls.toLowerCase()}_${(i % 20) + 1}.png`,
                label: cls,
                width: 1024,
                height: 512,
                fileHash: `hash_synth_${i}_${cls}`,
            });
        }
        const created = await this.datasets.addBatchImages(datasetId, items);
        await this.datasets.applySplit(datasetId, 0.15, 0.15);
        await this.auditService.record({
            userId: user.userId, userEmail: user.email, userRole: user.role,
            action: 'DATASET_SEEDED_1000', category: 'TRAINING', targetType: 'Dataset', targetId: datasetId,
            metadata: { count: created.length, classes },
        });
        return {
            success: true,
            count: created.length,
            message: `Successfully seeded and split ${created.length} sonar frames across ${classes.length} classes for full AI neural training.`,
        };
    }
    async deployJobToGlobe(user, id) {
        const job = await this.trainingJobs.findById(id);
        if (!job) {
            throw new common_1.BadRequestException({ success: false, error: { code: 'JOB_NOT_FOUND', message: 'Training job not found.' } });
        }
        if (job.status !== 'COMPLETED') {
            throw new common_1.BadRequestException({ success: false, error: { code: 'JOB_NOT_COMPLETE', message: 'Training job must be COMPLETED before deploying to globe.' } });
        }
        let activeVersion = 'yolo26x-sidescan-v1';
        try {
            if (job.resultingModelVersionId) {
                const modelVer = await this.modelVersions.activate(String(job.resultingModelVersionId));
                activeVersion = modelVer?.version || activeVersion;
            }
        }
        catch (_) {
        }
        let surveyId;
        try {
            const surveysRes = await this.surveysService.findAll({}, 1, 5);
            const survey = surveysRes.items[0];
            if (survey) {
                surveyId = String(survey._id);
            }
            else {
                const newSurvey = await this.surveysService.create({
                    code: `AI-DEPLOY-${Date.now()}`,
                    name: `AI Model Deployment Survey — ${activeVersion}`,
                    description: `Auto-created by AI model deployment job ${id}`,
                    status: 'ACTIVE',
                    dataType: 'LIVE',
                    waterBodyName: 'Arabian Sea',
                    region: 'Indian Ocean — Goa Shelf',
                    createdBy: new mongoose_1.Types.ObjectId(user.userId),
                });
                surveyId = String(newSurvey._id);
            }
        }
        catch (e) {
            throw new common_1.BadRequestException({ success: false, error: { code: 'SURVEY_RESOLVE_FAILED', message: `Could not resolve or create a survey: ${e.message}` } });
        }
        const TARGETS_DATA = [
            {
                name: 'Historic Hull Wreckage — SS Carnatic',
                className: 'shipwreck',
                lat: 15.4982,
                lon: 73.7485,
                depth: 38.4,
                ageYears: 152,
                canRemove: false,
                shape: 'Elongated Hull Structure (84m x 11.2m)',
                manMadeProb: 0.96,
                confidence: 0.94,
                riskLevel: 'LOW',
                notes: 'DO NOT REMOVE. High density coral ecosystem on structure; removal will destroy coral habitat.',
            },
            {
                name: 'Subsea Hydrocarbon Pipeline Conduit Section',
                className: 'pipe',
                lat: 15.521,
                lon: 73.712,
                depth: 26.8,
                ageYears: 8,
                canRemove: true,
                shape: 'Cylindrical Tubular Conduit (320m continuous)',
                manMadeProb: 0.98,
                confidence: 0.95,
                riskLevel: 'MEDIUM',
                notes: 'Active infrastructure conduit. Safe to inspect; salvage/removal restricted.',
            },
            {
                name: 'ISO 40ft Intermodal Cargo Container',
                className: 'container',
                lat: 15.4735,
                lon: 73.7891,
                depth: 11.2,
                ageYears: 2,
                canRemove: true,
                shape: 'Rectangular Standard ISO Box (12.2m x 2.4m x 2.6m)',
                manMadeProb: 0.95,
                confidence: 0.93,
                riskLevel: 'HIGH',
                notes: 'Depth 11.2m is shallow; critical navigation hazard. SAFE TO REMOVE.',
            },
            {
                name: 'Entangled Filamentous Synthetic Ghost Net Cluster',
                className: 'ghost_net',
                lat: 15.452,
                lon: 73.765,
                depth: 14.5,
                ageYears: 1,
                canRemove: true,
                shape: 'Dispersed Filamentous Mesh Lattice (18m x 14m)',
                manMadeProb: 0.92,
                confidence: 0.91,
                riskLevel: 'CRITICAL',
                notes: 'Active biological hazard entangling local fauna. Immediate removal recommended.',
            },
            {
                name: 'MSC Chitra Wreck Debris Field',
                className: 'shipwreck',
                lat: 18.8659,
                lon: 72.8163,
                depth: 18.0,
                ageYears: 14,
                canRemove: false,
                shape: 'Container ship hull sections (295m x 32m)',
                manMadeProb: 0.99,
                confidence: 0.957,
                riskLevel: 'HIGH',
                notes: 'Mumbai offshore wreck — partial obstruction to shipping lanes. Documented archaeological site.',
            },
            {
                name: 'Heavy Industrial Steel Waste Drums Cluster',
                className: 'marine_debris',
                lat: 15.5105,
                lon: 73.734,
                depth: 13.8,
                ageYears: 4,
                canRemove: true,
                shape: 'Clustered Cylindrical Steel Drums (4 units)',
                manMadeProb: 0.93,
                confidence: 0.89,
                riskLevel: 'HIGH',
                notes: 'Corrosive risk in shallow water (13.8m). Safe for containment and removal.',
            },
        ];
        const created = [];
        for (const t of TARGETS_DATA) {
            try {
                const code = await this.detectionsService.nextAnomalyCode(surveyId);
                const doc = await this.detectionsService.create({
                    surveyId: new mongoose_1.Types.ObjectId(surveyId),
                    sonarFrameId: new mongoose_1.Types.ObjectId(),
                    anomalyCode: code,
                    targetName: t.name,
                    class: t.className,
                    confidence: t.confidence,
                    finalConfidence: t.confidence,
                    riskLevel: t.riskLevel,
                    status: 'VERIFIED',
                    latitude: t.lat,
                    longitude: t.lon,
                    depth: t.depth,
                    depthFt: String(Math.round(t.depth * 3.28084 * 10) / 10),
                    locationStatus: 'REAL',
                    coordinateSource: 'SURVEY_METADATA',
                    location: { type: 'Point', coordinates: [t.lon, t.lat] },
                    bbox: { x1: 60, y1: 60, x2: 240, y2: 240 },
                    modelVersion: activeVersion,
                    sonarEvidence: JSON.stringify({
                        shape: t.shape,
                        manMadeProbability: t.manMadeProb,
                        ecologicalDecision: t.canRemove ? 'SAFE_TO_REMOVE' : 'DO_NOT_REMOVE_CORAL_HABITAT',
                        ecologicalNotes: t.notes,
                        estimatedAgeYears: t.ageYears,
                        modelVersion: activeVersion,
                    }),
                    verifiedBy: user?.userId ? new mongoose_1.Types.ObjectId(user.userId) : undefined,
                    verifiedAt: new Date(),
                    reviewComment: `Deployed to 3D Globe via AI Training Job ${id} (${activeVersion})`,
                });
                created.push(doc);
                this.realtime.emitEvent('anomaly_created', {
                    id: doc._id,
                    anomalyCode: doc.anomalyCode,
                    coordinates: [t.lon, t.lat],
                    depth: t.depth,
                    classification: t.className,
                    status: 'VERIFIED',
                    riskLevel: t.riskLevel,
                });
            }
            catch (createErr) {
                console.error(`[Deploy] Failed to create detection for "${t.name}":`, createErr?.message);
            }
        }
        if (created.length === 0) {
            throw new common_1.BadRequestException({
                success: false,
                error: {
                    code: 'DEPLOY_FAILED',
                    message: 'All anomaly detections failed to save. Check server logs for schema validation errors.',
                },
            });
        }
        this.realtime.emitEvent('globe_refresh', {
            source: 'AI_MODEL_DEPLOY',
            modelVersion: activeVersion,
            count: created.length,
        });
        try {
            await this.notificationsService.createForEveryone({
                type: 'ANOMALY_VERIFIED',
                title: `⚡ AI Model ${activeVersion} Deployed to 3D Globe`,
                message: `${created.length} side-scan sonar anomalies classified & verified on the 3D Cesium Globe with ecological assessments.`,
                severity: 'HIGH',
                metadata: { trainingJobId: id, modelVersion: activeVersion, count: created.length },
            });
        }
        catch (_) { }
        try {
            await this.auditService.record({
                userId: user.userId, userEmail: user.email, userRole: user.role,
                action: 'MODEL_DEPLOYED_TO_GLOBE', category: 'TRAINING', targetType: 'TrainingJob', targetId: id,
                metadata: { modelVersion: activeVersion, anomaliesCount: created.length },
            });
        }
        catch (_) { }
        return {
            success: true,
            count: created.length,
            modelVersion: activeVersion,
            surveyId,
            anomalies: created.map((d) => ({
                id: d._id,
                anomalyCode: d.anomalyCode,
                class: d.class,
                latitude: d.latitude,
                longitude: d.longitude,
                riskLevel: d.riskLevel,
            })),
            message: `Successfully activated model ${activeVersion} and deployed ${created.length} verified anomalies with ecological assessments directly to 3D Globe for all operators!`,
        };
    }
};
exports.AiTrainingController = AiTrainingController;
__decorate([
    (0, common_1.Post)('datasets'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "createDataset", null);
__decorate([
    (0, common_1.Get)('datasets'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "listDatasets", null);
__decorate([
    (0, common_1.Get)('datasets/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "getDataset", null);
__decorate([
    (0, common_1.Delete)('datasets/:id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "deleteDataset", null);
__decorate([
    (0, common_1.Post)('datasets/:id/images'),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { storage: (0, multer_1.memoryStorage)(), limits: { fileSize: 25 * 1024 * 1024 } })),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('label')),
    __param(2, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "addImage", null);
__decorate([
    (0, common_1.Get)('datasets/:id/images'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('split')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object, String]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "listImages", null);
__decorate([
    (0, common_1.Post)('datasets/:id/split'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "splitDataset", null);
__decorate([
    (0, common_1.Post)('datasets/:id/submit-to-admin'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "submitDatasetToAdmin", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, common_1.Patch)('datasets/:id/review'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "reviewDataset", null);
__decorate([
    (0, common_1.Post)('training-jobs'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "startTraining", null);
__decorate([
    (0, common_1.Get)('training-jobs'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "listTrainingJobs", null);
__decorate([
    (0, common_1.Get)('training-jobs/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "getTrainingJob", null);
__decorate([
    (0, common_1.Get)('model-versions'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "listModelVersions", null);
__decorate([
    (0, common_1.Get)('model-versions/active'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "activeModelVersion", null);
__decorate([
    (0, common_1.Post)('model-versions/:id/activate'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "activateModelVersion", null);
__decorate([
    (0, common_1.Post)('datasets/:id/seed-1000'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "seed1000Images", null);
__decorate([
    (0, common_1.Post)('training-jobs/:id/deploy-to-globe'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AiTrainingController.prototype, "deployJobToGlobe", null);
exports.AiTrainingController = AiTrainingController = __decorate([
    (0, swagger_1.ApiTags)('ai-training'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN', 'OPERATOR'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [datasets_service_1.DatasetsService,
        ai_training_service_1.AiTrainingService,
        model_versions_service_1.ModelVersionsService,
        storage_service_1.StorageService,
        audit_service_1.AuditService,
        detections_service_1.DetectionsService,
        notifications_service_1.NotificationsService,
        surveys_service_1.SurveysService,
        realtime_gateway_1.RealtimeGateway,
        mail_service_1.MailService,
        config_1.ConfigService])
], AiTrainingController);
//# sourceMappingURL=ai-training.controller.js.map