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
exports.WaterBodySchema = exports.WaterBody = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let WaterBody = class WaterBody {
};
exports.WaterBody = WaterBody;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, index: true }),
    __metadata("design:type", String)
], WaterBody.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: ['OCEAN', 'SEA', 'LAKE', 'RIVER'], index: true }),
    __metadata("design:type", String)
], WaterBody.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], WaterBody.prototype, "region", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, required: true }),
    __metadata("design:type", Object)
], WaterBody.prototype, "geometry", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], WaterBody.prototype, "source", void 0);
exports.WaterBody = WaterBody = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'water_bodies' })
], WaterBody);
exports.WaterBodySchema = mongoose_1.SchemaFactory.createForClass(WaterBody);
exports.WaterBodySchema.index({ geometry: '2dsphere' });
//# sourceMappingURL=water-body.schema.js.map