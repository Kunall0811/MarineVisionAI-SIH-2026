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
exports.HistoricalReferenceSchema = exports.HistoricalReference = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let HistoricalReference = class HistoricalReference {
};
exports.HistoricalReference = HistoricalReference;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true, index: true }),
    __metadata("design:type", String)
], HistoricalReference.prototype, "sourceId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], HistoricalReference.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['SHIPWRECK', 'CONTAINER', 'MARINE_DEBRIS', 'FISHING_GEAR', 'OTHER'], index: true }),
    __metadata("design:type", String)
], HistoricalReference.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", Number)
], HistoricalReference.prototype, "eventYear", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], HistoricalReference.prototype, "eventDate", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HistoricalReference.prototype, "latitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", Number)
], HistoricalReference.prototype, "longitude", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], HistoricalReference.prototype, "depthMeters", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], HistoricalReference.prototype, "quantity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], HistoricalReference.prototype, "description", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], HistoricalReference.prototype, "sourceOrganization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], HistoricalReference.prototype, "sourceUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['EXACT', 'APPROXIMATE'] }),
    __metadata("design:type", String)
], HistoricalReference.prototype, "coordinateAccuracy", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['HISTORICAL_REFERENCE'] }),
    __metadata("design:type", String)
], HistoricalReference.prototype, "dataStatus", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, default: null }),
    __metadata("design:type", Object)
], HistoricalReference.prototype, "normalizedLongitudeNote", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], HistoricalReference.prototype, "tags", void 0);
exports.HistoricalReference = HistoricalReference = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'historical_references' })
], HistoricalReference);
exports.HistoricalReferenceSchema = mongoose_1.SchemaFactory.createForClass(HistoricalReference);
exports.HistoricalReferenceSchema.index({ latitude: 1, longitude: 1 });
exports.HistoricalReferenceSchema.index({ type: 1, eventYear: -1 });
//# sourceMappingURL=historical-reference.schema.js.map