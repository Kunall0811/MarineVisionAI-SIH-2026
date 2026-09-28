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
exports.DatasetsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const dataset_schema_1 = require("./schemas/dataset.schema");
const dataset_image_schema_1 = require("./schemas/dataset-image.schema");
let DatasetsService = class DatasetsService {
    constructor(datasetModel, imageModel) {
        this.datasetModel = datasetModel;
        this.imageModel = imageModel;
    }
    create(data) {
        return this.datasetModel.create(data);
    }
    findAll(page = 1, limit = 30) {
        const skip = (page - 1) * limit;
        return Promise.all([
            this.datasetModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.datasetModel.countDocuments().exec(),
        ]);
    }
    async findById(id) {
        const dataset = await this.datasetModel.findById(id).exec();
        if (!dataset) {
            throw new common_1.NotFoundException({ success: false, error: { code: 'DATASET_NOT_FOUND', message: 'Dataset not found.' } });
        }
        return dataset;
    }
    delete(id) {
        return Promise.all([this.datasetModel.findByIdAndDelete(id).exec(), this.imageModel.deleteMany({ datasetId: id }).exec()]);
    }
    update(id, data) {
        return this.datasetModel.findByIdAndUpdate(id, data, { new: true }).exec();
    }
    async addImage(datasetId, data) {
        const dataset = await this.findById(datasetId);
        if (!dataset.classes.includes(data.label)) {
            throw new common_1.BadRequestException({
                success: false,
                error: {
                    code: 'INVALID_LABEL',
                    message: `Label "${data.label}" is not one of this dataset's classes: ${dataset.classes.join(', ')}`,
                },
            });
        }
        const image = await this.imageModel.create({ ...data, datasetId: new mongoose_2.Types.ObjectId(datasetId) });
        await this.datasetModel.findByIdAndUpdate(datasetId, { $inc: { imageCount: 1 } });
        return image;
    }
    async addBatchImages(datasetId, items) {
        const dataset = await this.findById(datasetId);
        if (!items.length)
            return [];
        const validItems = items.map((d) => ({
            ...d,
            label: dataset.classes.includes(d.label) ? d.label : dataset.classes[0],
            datasetId: new mongoose_2.Types.ObjectId(datasetId),
        }));
        const created = await this.imageModel.insertMany(validItems);
        await this.datasetModel.findByIdAndUpdate(datasetId, { $inc: { imageCount: created.length } });
        return created;
    }
    listImages(datasetId, page = 1, limit = 60, filter = {}) {
        const skip = (page - 1) * limit;
        return Promise.all([
            this.imageModel.find({ datasetId, ...filter }).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.imageModel.countDocuments({ datasetId, ...filter }).exec(),
        ]);
    }
    classDistribution(datasetId) {
        return this.imageModel.aggregate([
            { $match: { datasetId: new mongoose_2.Types.ObjectId(datasetId) } },
            { $group: { _id: '$label', count: { $sum: 1 } } },
        ]);
    }
    async applySplit(datasetId, valSplit, testSplit) {
        const dataset = await this.findById(datasetId);
        const dsId = new mongoose_2.Types.ObjectId(String(datasetId));
        let totalAssigned = 0;
        for (const label of dataset.classes) {
            const images = await this.imageModel.find({ datasetId: dsId, label }).exec();
            const shuffled = [...images].sort(() => Math.random() - 0.5);
            const nVal = Math.round(shuffled.length * valSplit);
            const nTest = Math.round(shuffled.length * testSplit);
            const valIds = shuffled.slice(0, nVal).map((i) => i._id);
            const testIds = shuffled.slice(nVal, nVal + nTest).map((i) => i._id);
            const trainIds = shuffled.slice(nVal + nTest).map((i) => i._id);
            await Promise.all([
                this.imageModel.updateMany({ _id: { $in: valIds } }, { split: 'VAL' }).exec(),
                this.imageModel.updateMany({ _id: { $in: testIds } }, { split: 'TEST' }).exec(),
                this.imageModel.updateMany({ _id: { $in: trainIds } }, { split: 'TRAIN' }).exec(),
            ]);
            totalAssigned += shuffled.length;
        }
        await this.datasetModel.findByIdAndUpdate(datasetId, { status: 'SPLIT' });
        return { totalAssigned };
    }
    imagesBySplit(datasetId, split) {
        const dsId = new mongoose_2.Types.ObjectId(String(datasetId));
        return this.imageModel.find({ datasetId: dsId, split }).exec();
    }
};
exports.DatasetsService = DatasetsService;
exports.DatasetsService = DatasetsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(dataset_schema_1.Dataset.name)),
    __param(1, (0, mongoose_1.InjectModel)(dataset_image_schema_1.DatasetImage.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        mongoose_2.Model])
], DatasetsService);
//# sourceMappingURL=datasets.service.js.map