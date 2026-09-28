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
exports.SurveySchema = exports.Survey = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let Survey = class Survey {
};
exports.Survey = Survey;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, trim: true, index: true }),
    __metadata("design:type", String)
], Survey.prototype, "code", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Survey.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Survey.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, default: null }),
    __metadata("design:type", Object)
], Survey.prototype, "waterBodyId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Survey.prototype, "waterBodyName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], Survey.prototype, "region", void 0);
__decorate([
    (0, mongoose_1.Prop)({
        enum: ['PLANNED', 'ACTIVE', 'PROCESSING', 'COMPLETED', 'ARCHIVED'],
        default: 'PLANNED',
        index: true,
    }),
    __metadata("design:type", String)
], Survey.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['LIVE', 'HISTORICAL'], default: 'LIVE', index: true }),
    __metadata("design:type", String)
], Survey.prototype, "dataType", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], Survey.prototype, "historicalSource", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], Survey.prototype, "createdBy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [mongoose_2.Types.ObjectId], ref: 'User', default: [] }),
    __metadata("design:type", Array)
], Survey.prototype, "assignedOperators", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Survey.prototype, "totalFrames", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Survey.prototype, "processedFrames", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: 0 }),
    __metadata("design:type", Number)
], Survey.prototype, "failedFrames", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Survey.prototype, "surveyDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Date, default: null }),
    __metadata("design:type", Object)
], Survey.prototype, "completedAt", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: () => ({ type: 'LineString', coordinates: [] }) }),
    __metadata("design:type", Object)
], Survey.prototype, "route", void 0);
exports.Survey = Survey = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'surveys' })
], Survey);
exports.SurveySchema = mongoose_1.SchemaFactory.createForClass(Survey);
exports.SurveySchema.index({ route: '2dsphere' });
exports.SurveySchema.index({ createdAt: -1 });
//# sourceMappingURL=survey.schema.js.map