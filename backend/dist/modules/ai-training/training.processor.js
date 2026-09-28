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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTrainingProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ai_training_service_1 = require("./ai-training.service");
const datasets_service_1 = require("./datasets.service");
const model_versions_service_1 = require("./model-versions.service");
const storage_service_1 = require("../storage/storage.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const feature_extractor_1 = require("./feature-extractor");
const trainer_service_1 = require("./trainer.service");
const onnx_exporter_1 = require("./onnx-exporter");
let AiTrainingProcessor = class AiTrainingProcessor extends bullmq_1.WorkerHost {
    constructor(trainingJobs, datasets, modelVersions, storage, trainer, realtime) {
        super();
        this.trainingJobs = trainingJobs;
        this.datasets = datasets;
        this.modelVersions = modelVersions;
        this.storage = storage;
        this.trainer = trainer;
        this.realtime = realtime;
        this.logger = new common_1.Logger('AiTrainingProcessor');
        this.modelsRoot = path.resolve(process.env.STORAGE_LOCAL_PATH || './sonar-storage', '..', 'ai-models', 'trained');
        if (!fs.existsSync(this.modelsRoot))
            fs.mkdirSync(this.modelsRoot, { recursive: true });
    }
    onModuleInit() {
        this.trainingJobs.setProcessor(this);
    }
    async process(job) {
        const trainingJobId = job.data.trainingJobId;
        const trainingJob = await this.trainingJobs.findById(trainingJobId);
        if (!trainingJob)
            throw new Error('Training job not found');
        const startTime = Date.now();
        const emit = (progressPct, status) => {
            const elapsedSeconds = Math.max(1, Math.round((Date.now() - startTime) / 1000));
            let etaSeconds = 0;
            if (progressPct > 0 && progressPct < 100) {
                const estTotal = elapsedSeconds / (progressPct / 100);
                etaSeconds = Math.max(0, Math.round(estTotal - elapsedSeconds));
            }
            const formattedEta = progressPct >= 100
                ? 'Completed'
                : etaSeconds > 60
                    ? `${Math.floor(etaSeconds / 60)}m ${etaSeconds % 60}s remaining`
                    : `${etaSeconds}s remaining`;
            this.realtime.emitEvent('training_progress', {
                trainingJobId,
                progressPct,
                status,
                elapsedSeconds,
                etaSeconds,
                formattedEta,
            });
        };
        try {
            await this.trainingJobs.update(trainingJobId, { status: 'RUNNING', startedAt: new Date() });
            emit(1, 'RUNNING');
            const dataset = await this.datasets.findById(String(trainingJob.datasetId));
            const classLabels = dataset.classes;
            const { hyperparameters: hp } = trainingJob;
            if (dataset.status === 'DRAFT') {
                await this.datasets.applySplit(String(dataset._id), hp.valSplit, hp.testSplit);
                await this.trainingJobs.appendLog(trainingJobId, `Dataset had no manual split - auto-applied ${hp.valSplit * 100}% val / ${hp.testSplit * 100}% test.`);
            }
            const [trainImages, valImages, testImages] = await Promise.all([
                this.datasets.imagesBySplit(String(dataset._id), 'TRAIN'),
                this.datasets.imagesBySplit(String(dataset._id), 'VAL'),
                this.datasets.imagesBySplit(String(dataset._id), 'TEST'),
            ]);
            if (trainImages.length === 0)
                throw new Error('No TRAIN-split images available for this dataset.');
            if (valImages.length === 0)
                throw new Error('No VAL-split images available - upload more images or lower valSplit.');
            await this.trainingJobs.appendLog(trainingJobId, `Split sizes - train:${trainImages.length} val:${valImages.length} test:${testImages.length}`);
            emit(10, 'RUNNING');
            const labelIndex = new Map(classLabels.map((c, i) => [c, i]));
            const buildSamples = async (images, augment) => {
                const samples = [];
                for (const img of images) {
                    const buffer = this.storage.readFile(img.storagePath);
                    const features = await (0, feature_extractor_1.extractFeatures)(buffer);
                    samples.push({ features, label: labelIndex.get(img.label) });
                    if (augment) {
                        for (let v = 1; v <= 2; v++) {
                            const augBuffer = await (0, feature_extractor_1.augmentImage)(buffer, v);
                            const augFeatures = await (0, feature_extractor_1.extractFeatures)(augBuffer);
                            samples.push({ features: augFeatures, label: labelIndex.get(img.label) });
                        }
                    }
                }
                return samples;
            };
            const trainSamples = await buildSamples(trainImages, hp.useAugmentation);
            emit(35, 'RUNNING');
            const valSamples = await buildSamples(valImages, false);
            emit(45, 'RUNNING');
            const testSamples = testImages.length ? await buildSamples(testImages, false) : [];
            emit(50, 'RUNNING');
            await this.trainingJobs.appendLog(trainingJobId, `Feature extraction complete (train samples incl. augmentation: ${trainSamples.length}).`);
            const { weights, finalLoss, epochsRun } = this.trainer.train(trainSamples, classLabels.length, hp.epochs, hp.learningRate, hp.batchSize, (epoch, loss) => {
                if (epoch % Math.max(1, Math.floor(hp.epochs / 10)) === 0) {
                    const pct = 50 + Math.round((epoch / hp.epochs) * 35);
                    const elapsed = Math.max(1, Math.round((Date.now() - startTime) / 1000));
                    const estTotal = elapsed / (pct / 100);
                    const remaining = Math.max(0, Math.round(estTotal - elapsed));
                    this.trainingJobs.appendLog(trainingJobId, `Epoch ${epoch}/${hp.epochs} - loss ${loss.toFixed(4)} [${remaining}s ETA]`);
                    emit(pct, 'RUNNING');
                }
            });
            emit(85, 'RUNNING');
            const latencies = [];
            for (const s of valSamples) {
                const t0 = process.hrtime.bigint();
                this.trainer.predict(weights, s.features);
                const t1 = process.hrtime.bigint();
                latencies.push(Number(t1 - t0) / 1e6);
            }
            const evalSet = testSamples.length ? testSamples : valSamples;
            const metrics = this.trainer.evaluate(weights, evalSet, classLabels, latencies);
            metrics.trainSamples = trainSamples.length;
            metrics.valSamples = valSamples.length;
            metrics.testSamples = testSamples.length;
            metrics.epochsRun = epochsRun;
            metrics.finalTrainLoss = Math.round(finalLoss * 10000) / 10000;
            await this.trainingJobs.appendLog(trainingJobId, `Training complete - accuracy ${(metrics.accuracy * 100).toFixed(1)}%, macro-F1 ${(metrics.f1Macro * 100).toFixed(1)}% on ${testSamples.length ? 'TEST' : 'VAL'} split.`);
            emit(92, 'RUNNING');
            const existingVersions = await this.modelVersions.findAll();
            const versionLabel = `sonar-classifier-v${existingVersions.length + 1}`;
            const weightsFileName = `${versionLabel}.weights.json`;
            const onnxFileName = `${versionLabel}.onnx`;
            fs.writeFileSync(path.join(this.modelsRoot, weightsFileName), JSON.stringify({ W: weights.W, b: weights.b, featureNames: feature_extractor_1.FEATURE_NAMES, classLabels }, null, 2));
            const onnxBuffer = (0, onnx_exporter_1.exportToOnnx)(weights, feature_extractor_1.FEATURE_NAMES, classLabels, versionLabel);
            fs.writeFileSync(path.join(this.modelsRoot, onnxFileName), onnxBuffer);
            const modelVersion = await this.modelVersions.create({
                version: versionLabel,
                architecture: 'lightweight-softmax-classifier-v1',
                datasetId: dataset._id,
                trainingJobId: trainingJob._id,
                metricsSnapshot: metrics,
                classLabels,
                featureNames: feature_extractor_1.FEATURE_NAMES,
                weightsStoragePath: path.join('ai-models', 'trained', weightsFileName),
                onnxStoragePath: path.join('ai-models', 'trained', onnxFileName),
                isActive: false,
                createdBy: trainingJob.createdBy,
            });
            await this.trainingJobs.update(trainingJobId, {
                status: 'COMPLETED',
                progressPct: 100,
                metrics,
                resultingModelVersionId: modelVersion._id,
                completedAt: new Date(),
            });
            emit(100, 'COMPLETED');
            this.realtime.emitEvent('training_completed', { trainingJobId, modelVersionId: modelVersion._id, version: versionLabel });
            return { trainingJobId, modelVersionId: modelVersion._id };
        }
        catch (err) {
            this.logger.error(`Training job ${trainingJobId} failed: ${err.message}`, err.stack);
            await this.trainingJobs.update(trainingJobId, { status: 'FAILED', errorMessage: err.message, completedAt: new Date() });
            await this.trainingJobs.appendLog(trainingJobId, `FAILED: ${err.message}`);
            emit(0, 'FAILED');
            throw err;
        }
    }
};
exports.AiTrainingProcessor = AiTrainingProcessor;
exports.AiTrainingProcessor = AiTrainingProcessor = __decorate([
    (0, bullmq_1.Processor)('ai-training', { concurrency: 1 }),
    __metadata("design:paramtypes", [ai_training_service_1.AiTrainingService,
        datasets_service_1.DatasetsService,
        model_versions_service_1.ModelVersionsService,
        storage_service_1.StorageService,
        trainer_service_1.TrainerService,
        realtime_gateway_1.RealtimeGateway])
], AiTrainingProcessor);
//# sourceMappingURL=training.processor.js.map