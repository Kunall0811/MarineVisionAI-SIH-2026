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
exports.DetectionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const detection_schema_1 = require("./schemas/detection.schema");
let DetectionsService = class DetectionsService {
    constructor(detectionModel) {
        this.detectionModel = detectionModel;
    }
    create(data) {
        return this.detectionModel.create(data);
    }
    async nextAnomalyCode(surveyId) {
        const count = await this.detectionModel.countDocuments({ surveyId }).exec();
        return `ANM-${String(count + 1).padStart(3, '0')}`;
    }
    async findAll(filter = {}, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.detectionModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.detectionModel.countDocuments(filter).exec(),
        ]);
        return { items, total };
    }
    async findById(id) {
        const detection = await this.detectionModel.findById(id).exec();
        if (!detection) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'DETECTION_NOT_FOUND', message: 'Detection not found.' },
            });
        }
        return detection;
    }
    findBySurvey(surveyId, filter = {}) {
        return this.detectionModel.find({ surveyId, ...filter }).sort({ createdAt: -1 }).exec();
    }
    update(id, update) {
        return this.detectionModel.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    async verify(id, verifiedBy, comment) {
        return this.detectionModel
            .findByIdAndUpdate(id, { status: 'VERIFIED', verifiedBy, verifiedAt: new Date(), reviewComment: comment || '' }, { new: true })
            .exec();
    }
    async reject(id, verifiedBy, comment) {
        return this.detectionModel
            .findByIdAndUpdate(id, { status: 'REJECTED', verifiedBy, verifiedAt: new Date(), reviewComment: comment || '' }, { new: true })
            .exec();
    }
    async needsReview(id, verifiedBy, comment) {
        return this.detectionModel
            .findByIdAndUpdate(id, { status: 'NEEDS_REVIEW', verifiedBy, verifiedAt: new Date(), reviewComment: comment || '' }, { new: true })
            .exec();
    }
    countBySurveyGroupedByClass(surveyId) {
        return this.detectionModel.aggregate([
            { $match: { surveyId: new mongoose_2.Types.ObjectId(surveyId) } },
            { $group: { _id: '$class', count: { $sum: 1 } } },
        ]);
    }
    async globalStatistics() {
        const [byClass, byStatus, byRisk, total, highRisk] = await Promise.all([
            this.detectionModel.aggregate([{ $group: { _id: '$class', count: { $sum: 1 } } }]),
            this.detectionModel.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
            this.detectionModel.aggregate([{ $group: { _id: '$riskLevel', count: { $sum: 1 } } }]),
            this.detectionModel.countDocuments().exec(),
            this.detectionModel.countDocuments({ riskLevel: { $in: ['HIGH', 'CRITICAL'] } }).exec(),
        ]);
        return { byClass, byStatus, byRisk, total, highRisk };
    }
    findNearby(longitude, latitude, maxDistanceMetres = 5000, filter = {}) {
        return this.detectionModel
            .find({
            ...filter,
            location: {
                $near: {
                    $geometry: { type: 'Point', coordinates: [longitude, latitude] },
                    $maxDistance: maxDistanceMetres,
                },
            },
        })
            .exec();
    }
    findWithinBounds(swLng, swLat, neLng, neLat, filter = {}) {
        return this.detectionModel
            .find({
            ...filter,
            location: {
                $geoWithin: {
                    $box: [
                        [swLng, swLat],
                        [neLng, neLat],
                    ],
                },
            },
        })
            .exec();
    }
};
exports.DetectionsService = DetectionsService;
exports.DetectionsService = DetectionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(detection_schema_1.Detection.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], DetectionsService);
//# sourceMappingURL=detections.service.js.map