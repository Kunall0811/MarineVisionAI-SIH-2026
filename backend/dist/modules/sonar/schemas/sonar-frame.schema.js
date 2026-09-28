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
exports.SonarFrameSchema = exports.SonarFrame = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let SonarFrame = class SonarFrame {
};
exports.SonarFrame = SonarFrame;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Survey', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], SonarFrame.prototype, "surveyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SonarFrame.prototype, "fileName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SonarFrame.prototype, "storagePath", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], SonarFrame.prototype, "fileHash", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['png', 'jpg', 'jpeg', 'tiff', 'xtf', 'jsf'] }),
    __metadata("design:type", String)
], SonarFrame.prototype, "fileType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "timestamp", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "pingNumber", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "latitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "longitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "heading", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "depth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "altitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "heave", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "pitch", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "roll", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['FULL', 'PARTIAL', 'UNAVAILABLE'], default: 'UNAVAILABLE' }),
    __metadata("design:type", String)
], SonarFrame.prototype, "motionCorrectionStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "range", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['PORT', 'STARBOARD', 'BOTH', 'UNKNOWN'], default: 'UNKNOWN' }),
    __metadata("design:type", String)
], SonarFrame.prototype, "side", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['REAL', 'ESTIMATED', 'UNAVAILABLE'], default: 'UNAVAILABLE', index: true }),
    __metadata("design:type", String)
], SonarFrame.prototype, "navigationSource", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "sensorMetadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "imageWidth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "imageHeight", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['QUEUED', 'PREPROCESSING', 'INFERENCE', 'COMPLETED', 'FAILED', 'INVALID_INPUT'],
        default: 'QUEUED',
        index: true,
    }),
    __metadata("design:type", String)
], SonarFrame.prototype, "processingStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['ADMIN', 'OPERATOR'], default: 'ADMIN', index: true }),
    __metadata("design:type", String)
], SonarFrame.prototype, "uploadedByRole", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "uploadedByUserId", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['APPROVED', 'PENDING_REVIEW', 'REJECTED', 'CORRECTED'],
        default: 'APPROVED',
        index: true,
    }),
    __metadata("design:type", String)
], SonarFrame.prototype, "reviewStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "domainValidity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "processingError", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "preprocessedStoragePath", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "preprocessingVersion", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, min: 0, max: 1, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "dropoutRatio", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: ['GOOD', 'FAIR', 'POOR', 'UNUSABLE'], default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "qualityStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, min: 0, max: 1, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "imageQualityScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "preprocessingParameters", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], SonarFrame.prototype, "processedAt", void 0);
exports.SonarFrame = SonarFrame = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'sonar_frames' })
], SonarFrame);
exports.SonarFrameSchema = mongoose_1.SchemaFactory.createForClass(SonarFrame);
exports.SonarFrameSchema.index({ surveyId: 1, createdAt: -1 });
exports.SonarFrameSchema.index({ surveyId: 1, processingStatus: 1 });
//# sourceMappingURL=sonar-frame.schema.js.map