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
exports.AiTrainingService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const mongoose_2 = require("mongoose");
const bullmq_2 = require("bullmq");
const training_job_schema_1 = require("./schemas/training-job.schema");
let AiTrainingService = class AiTrainingService {
    constructor(jobModel, trainingQueue) {
        this.jobModel = jobModel;
        this.trainingQueue = trainingQueue;
    }
    setProcessor(proc) {
        this.processor = proc;
    }
    async startJob(input) {
        const job = await this.jobModel.create({
            datasetId: input.datasetId,
            hyperparameters: {
                epochs: input.epochs,
                learningRate: input.learningRate,
                batchSize: input.batchSize,
                valSplit: input.valSplit,
                testSplit: input.testSplit,
                useAugmentation: input.useAugmentation,
                architecture: 'lightweight-softmax-classifier-v1',
            },
            status: 'QUEUED',
            createdBy: input.createdBy,
        });
        try {
            await Promise.race([
                this.trainingQueue.add('run-training', { trainingJobId: String(job._id) }, { removeOnComplete: true, removeOnFail: 50 }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('QUEUE_TIMEOUT')), 1000)),
            ]);
        }
        catch (queueErr) {
            if (this.processor) {
                setImmediate(() => {
                    this.processor?.process({ data: { trainingJobId: String(job._id) } }).catch((err) => {
                        console.error('In-process training execution failed:', err);
                    });
                });
            }
        }
        return job;
    }
    findAll(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        return Promise.all([
            this.jobModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.jobModel.countDocuments().exec(),
        ]);
    }
    findById(id) {
        return this.jobModel.findById(id).exec();
    }
    update(id, update) {
        return this.jobModel.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    appendLog(id, line) {
        return this.jobModel.findByIdAndUpdate(id, { $push: { logLines: `[${new Date().toISOString()}] ${line}` } }).exec();
    }
};
exports.AiTrainingService = AiTrainingService;
exports.AiTrainingService = AiTrainingService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(training_job_schema_1.TrainingJob.name)),
    __param(1, (0, bullmq_1.InjectQueue)('ai-training')),
    __metadata("design:paramtypes", [mongoose_2.Model,
        bullmq_2.Queue])
], AiTrainingService);
//# sourceMappingURL=ai-training.service.js.map