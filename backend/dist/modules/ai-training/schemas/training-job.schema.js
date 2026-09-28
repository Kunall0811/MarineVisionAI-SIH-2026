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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrainingJobSchema = exports.TrainingJob = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let TrainingJob = class TrainingJob {
};
exports.TrainingJob = TrainingJob;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Dataset', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TrainingJob.prototype, "datasetId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: {
            epochs: Number,
            learningRate: Number,
            batchSize: Number,
            valSplit: Number,
            testSplit: Number,
            useAugmentation: Boolean,
            architecture: String,
        },
        required: true,
    }),
    __metadata("design:type", Object)
], TrainingJob.prototype, "hyperparameters", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'], default: 'QUEUED', index: true }),
    __metadata("design:type", String)
], TrainingJob.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], TrainingJob.prototype, "progressPct", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], TrainingJob.prototype, "logLines", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], TrainingJob.prototype, "metrics", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], TrainingJob.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'ModelVersion', default: null }),
    __metadata("design:type", Object)
], TrainingJob.prototype, "resultingModelVersionId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], TrainingJob.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], TrainingJob.prototype, "startedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], TrainingJob.prototype, "completedAt", void 0);
exports.TrainingJob = TrainingJob = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'ai_training_jobs' })
], TrainingJob);
exports.TrainingJobSchema = mongoose_1.SchemaFactory.createForClass(TrainingJob);
exports.TrainingJobSchema.index({ createdAt: -1 });
//# sourceMappingURL=training-job.schema.js.map