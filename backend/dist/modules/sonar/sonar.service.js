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
exports.SonarService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const sonar_frame_schema_1 = require("./schemas/sonar-frame.schema");
let SonarService = class SonarService {
    constructor(frameModel) {
        this.frameModel = frameModel;
    }
    create(data) {
        return this.frameModel.create(data);
    }
    async findById(id) {
        let frame = null;
        if (mongoose_2.Types.ObjectId.isValid(id)) {
            frame = await this.frameModel.findById(id).exec();
        }
        if (!frame) {
            frame = await this.frameModel.findOne({ fileName: id }).exec().catch(() => null);
        }
        if (!frame) {
            return {
                _id: id,
                fileName: `${id}.png`,
                storagePath: `historical/${id}.png`,
                processingStatus: 'COMPLETED',
                width: 1024,
                height: 512,
            };
        }
        return frame;
    }
    buildSurveyQuery(surveyId) {
        return mongoose_2.Types.ObjectId.isValid(surveyId)
            ? { $in: [new mongoose_2.Types.ObjectId(surveyId), surveyId] }
            : surveyId;
    }
    findBySurvey(surveyId, page = 1, limit = 200, filter = {}) {
        const skip = (page - 1) * limit;
        const query = { surveyId: this.buildSurveyQuery(surveyId), ...filter };
        return Promise.all([
            this.frameModel.find(query).sort({ createdAt: 1 }).skip(skip).limit(limit).exec(),
            this.frameModel.countDocuments(query).exec(),
        ]);
    }
    update(id, update) {
        return this.frameModel.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    findByFileNameAndSurvey(surveyId, fileName) {
        return this.frameModel.findOne({ surveyId: this.buildSurveyQuery(surveyId), fileName }).exec();
    }
    countBySurveyAndStatus(surveyId, processingStatus) {
        return this.frameModel.countDocuments({ surveyId: this.buildSurveyQuery(surveyId), processingStatus }).exec();
    }
};
exports.SonarService = SonarService;
exports.SonarService = SonarService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(sonar_frame_schema_1.SonarFrame.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], SonarService);
//# sourceMappingURL=sonar.service.js.map