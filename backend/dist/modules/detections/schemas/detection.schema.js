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
exports.DetectionSchema = exports.Detection = exports.COORDINATE_SOURCES = exports.DETECTION_CLASSES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.DETECTION_CLASSES = [
    'ghost_net',
    'fishing_gear',
    'container',
    'pipe',
    'cylinder',
    'shipwreck',
    'rock',
    'marine_debris',
    'artificial_structure',
    'unknown_anomaly',
];
exports.COORDINATE_SOURCES = [
    'GPS_NAVIGATION_METADATA',
    'SURVEY_METADATA',
    'ESTIMATED_FROM_SONAR_GEOMETRY',
    'HISTORICAL_DATASET',
    'SIMULATED_DEMO'
];
let Detection = class Detection {
};
exports.Detection = Detection;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Survey', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Detection.prototype, "surveyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'SonarFrame', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Detection.prototype, "sonarFrameId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], Detection.prototype, "anomalyCode", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.DETECTION_CLASSES, index: true }),
    __metadata("design:type", String)
], Detection.prototype, "class", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 1 }),
    __metadata("design:type", Number)
], Detection.prototype, "confidence", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, min: 0, max: 1 }),
    __metadata("design:type", Number)
], Detection.prototype, "finalConfidence", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        type: { x1: Number, y1: Number, x2: Number, y2: Number },
        required: true,
    }),
    __metadata("design:type", Object)
], Detection.prototype, "bbox", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [[Number]], default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "segmentationMask", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "latitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "longitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "depth", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "length", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "width", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "height", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, max: 1, default: 0.5 }),
    __metadata("design:type", Number)
], Detection.prototype, "artificialProbability", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, max: 1, default: 0.5 }),
    __metadata("design:type", Number)
], Detection.prototype, "naturalProbability", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, max: 1, default: 0 }),
    __metadata("design:type", Number)
], Detection.prototype, "shadowScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ min: 0, max: 1, default: 0 }),
    __metadata("design:type", Number)
], Detection.prototype, "noiseScore", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'LOW', index: true }),
    __metadata("design:type", String)
], Detection.prototype, "riskLevel", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['PENDING_REVIEW', 'VERIFIED', 'REJECTED', 'NEEDS_REVIEW'],
        default: 'PENDING_REVIEW',
        index: true,
    }),
    __metadata("design:type", String)
], Detection.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "verifiedBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "verifiedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Detection.prototype, "reviewComment", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Detection.prototype, "modelVersion", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['REAL', 'ESTIMATED', 'UNAVAILABLE'], required: true, index: true }),
    __metadata("design:type", String)
], Detection.prototype, "locationStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['LIVE', 'HISTORICAL', 'SIMULATED'], default: 'LIVE', index: true }),
    __metadata("design:type", String)
], Detection.prototype, "dataType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: Object.values(exports.COORDINATE_SOURCES), default: 'ESTIMATED_FROM_SONAR_GEOMETRY' }),
    __metadata("design:type", String)
], Detection.prototype, "coordinateSource", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "historicalSource", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null, index: true }),
    __metadata("design:type", Object)
], Detection.prototype, "targetName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "detailedType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "depthFt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "sonarEvidence", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: null }),
    __metadata("design:type", Object)
], Detection.prototype, "location", void 0);
exports.Detection = Detection = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'detections' })
], Detection);
exports.DetectionSchema = mongoose_1.SchemaFactory.createForClass(Detection);
exports.DetectionSchema.index({ location: '2dsphere' });
exports.DetectionSchema.index({ surveyId: 1, class: 1 });
exports.DetectionSchema.index({ surveyId: 1, status: 1 });
exports.DetectionSchema.index({ surveyId: 1, riskLevel: 1 });
//# sourceMappingURL=detection.schema.js.map