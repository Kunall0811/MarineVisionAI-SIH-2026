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
exports.ModelVersionsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const model_version_schema_1 = require("./schemas/model-version.schema");
function hasRealMetrics(metrics) {
    if (!metrics)
        return false;
    const candidates = [
        metrics.precisionMacro,
        metrics.recallMacro,
        metrics.f1Macro,
        metrics.accuracy,
        metrics.mAP50,
        metrics.map50,
    ];
    return candidates.some((v) => typeof v === 'number' && !Number.isNaN(v));
}
let ModelVersionsService = class ModelVersionsService {
    constructor(model) {
        this.model = model;
    }
    create(data) {
        const qualityState = hasRealMetrics(data.metricsSnapshot) ? 'VALIDATED' : 'EXPERIMENTAL';
        return this.model.create({ ...data, qualityState, isActive: false });
    }
    findAll() {
        return this.model.find().sort({ createdAt: -1 }).exec();
    }
    async findById(id) {
        const version = await this.model.findById(id).exec();
        if (!version) {
            throw new common_1.NotFoundException({ success: false, error: { code: 'MODEL_VERSION_NOT_FOUND', message: 'Model version not found.' } });
        }
        return version;
    }
    async promoteToCandidate(id) {
        const version = await this.findById(id);
        if (version.qualityState !== 'VALIDATED') {
            throw new common_1.BadRequestException({
                success: false,
                error: {
                    code: 'MODEL_NOT_VALIDATED',
                    message: `Model is ${version.qualityState}, not VALIDATED. It needs real test-split evaluation metrics before it can become a production candidate.`,
                },
            });
        }
        return this.model.findByIdAndUpdate(id, { qualityState: 'PRODUCTION_CANDIDATE' }, { new: true }).exec();
    }
    async activate(id) {
        const version = await this.findById(id);
        if (version.qualityState !== 'PRODUCTION_CANDIDATE' && version.qualityState !== 'VALIDATED') {
            throw new common_1.BadRequestException({
                success: false,
                error: {
                    code: 'MODEL_NOT_READY',
                    message: `Model is ${version.qualityState}. Only VALIDATED or PRODUCTION_CANDIDATE models (real test-split metrics on file) can be activated. Experimental/smoke-test models cannot serve production inference.`,
                },
            });
        }
        await this.model.updateMany({ isActive: true }, { isActive: false, qualityState: 'VALIDATED' }).exec();
        return this.model.findByIdAndUpdate(id, { isActive: true, qualityState: 'ACTIVE' }, { new: true }).exec();
    }
    active() {
        return this.model.findOne({ isActive: true }).exec();
    }
};
exports.ModelVersionsService = ModelVersionsService;
exports.ModelVersionsService = ModelVersionsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(model_version_schema_1.ModelVersion.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], ModelVersionsService);
//# sourceMappingURL=model-versions.service.js.map