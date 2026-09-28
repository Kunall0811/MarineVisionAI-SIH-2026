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
exports.SurveysService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const survey_schema_1 = require("./schemas/survey.schema");
let SurveysService = class SurveysService {
    constructor(surveyModel) {
        this.surveyModel = surveyModel;
    }
    create(data) {
        return this.surveyModel.create(data);
    }
    async findAll(filter = {}, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.surveyModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.surveyModel.countDocuments(filter).exec(),
        ]);
        return { items, total };
    }
    async findById(id) {
        let survey = null;
        if (mongoose_2.Types.ObjectId.isValid(id)) {
            survey = await this.surveyModel.findById(id).exec();
        }
        if (!survey) {
            survey = await this.surveyModel.findOne({ code: id }).exec();
        }
        if (!survey) {
            throw new common_1.NotFoundException({
                success: false,
                error: { code: 'SURVEY_NOT_FOUND', message: 'Survey not found.' },
            });
        }
        return survey;
    }
    async findByCode(code) {
        return this.surveyModel.findOne({ code }).exec();
    }
    async update(id, update) {
        if (mongoose_2.Types.ObjectId.isValid(id)) {
            return this.surveyModel.findByIdAndUpdate(id, update, { new: true }).exec();
        }
        return this.surveyModel.findOneAndUpdate({ code: id }, update, { new: true }).exec();
    }
    async incrementFrameCounts(id, fields) {
        const inc = {};
        if (fields.totalFrames)
            inc.totalFrames = fields.totalFrames;
        if (fields.processedFrames)
            inc.processedFrames = fields.processedFrames;
        if (fields.failedFrames)
            inc.failedFrames = fields.failedFrames;
        if (mongoose_2.Types.ObjectId.isValid(id)) {
            return this.surveyModel.findByIdAndUpdate(id, { $inc: inc }, { new: true }).exec();
        }
        return this.surveyModel.findOneAndUpdate({ code: id }, { $inc: inc }, { new: true }).exec();
    }
    async appendRoutePoint(id, longitude, latitude) {
        return this.surveyModel
            .findByIdAndUpdate(id, { $push: { 'route.coordinates': [longitude, latitude] } }, { new: true })
            .exec();
    }
    delete(id) {
        return this.surveyModel.findByIdAndDelete(id).exec();
    }
    isOperatorAssigned(survey, operatorId) {
        return survey.assignedOperators.some((id) => String(id) === operatorId);
    }
};
exports.SurveysService = SurveysService;
exports.SurveysService = SurveysService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(survey_schema_1.Survey.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SurveysService);
//# sourceMappingURL=surveys.service.js.map