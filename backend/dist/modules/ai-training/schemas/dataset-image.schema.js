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
exports.DatasetImageSchema = exports.DatasetImage = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let DatasetImage = class DatasetImage {
};
exports.DatasetImage = DatasetImage;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Dataset', required: true, index: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], DatasetImage.prototype, "datasetId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], DatasetImage.prototype, "fileName", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], DatasetImage.prototype, "storagePath", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], DatasetImage.prototype, "label", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['TRAIN', 'VAL', 'TEST', 'UNASSIGNED'], default: 'UNASSIGNED', index: true }),
    __metadata("design:type", String)
], DatasetImage.prototype, "split", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], DatasetImage.prototype, "width", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Number, default: null }),
    __metadata("design:type", Object)
], DatasetImage.prototype, "height", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false }),
    __metadata("design:type", Boolean)
], DatasetImage.prototype, "isAugmented", void 0);
exports.DatasetImage = DatasetImage = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'ai_dataset_images' })
], DatasetImage);
exports.DatasetImageSchema = mongoose_1.SchemaFactory.createForClass(DatasetImage);
exports.DatasetImageSchema.index({ datasetId: 1, split: 1 });
//# sourceMappingURL=dataset-image.schema.js.map