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
exports.ModelVersionSchema = exports.ModelVersion = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let ModelVersion = class ModelVersion {
};
exports.ModelVersion = ModelVersion;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], ModelVersion.prototype, "version", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, default: 'lightweight-softmax-classifier-v1' }),
    __metadata("design:type", String)
], ModelVersion.prototype, "architecture", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Dataset', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ModelVersion.prototype, "datasetId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'TrainingJob', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ModelVersion.prototype, "trainingJobId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], ModelVersion.prototype, "metricsSnapshot", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true }),
    __metadata("design:type", Array)
], ModelVersion.prototype, "classLabels", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], required: true }),
    __metadata("design:type", Array)
], ModelVersion.prototype, "featureNames", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ModelVersion.prototype, "weightsStoragePath", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], ModelVersion.prototype, "onnxStoragePath", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], ModelVersion.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['EXPERIMENTAL', 'VALIDATED', 'PRODUCTION_CANDIDATE', 'ACTIVE'],
        default: 'EXPERIMENTAL',
        index: true,
    }),
    __metadata("design:type", String)
], ModelVersion.prototype, "qualityState", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], ModelVersion.prototype, "createdBy", void 0);
exports.ModelVersion = ModelVersion = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'ai_model_versions' })
], ModelVersion);
exports.ModelVersionSchema = mongoose_1.SchemaFactory.createForClass(ModelVersion);
//# sourceMappingURL=model-version.schema.js.map