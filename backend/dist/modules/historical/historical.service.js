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
exports.HistoricalService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const historical_reference_schema_1 = require("./schemas/historical-reference.schema");
const historical_data_1 = require("../../seed/historical-data");
let HistoricalService = class HistoricalService {
    constructor(model) {
        this.model = model;
    }
    async list(filters = {}) {
        const q = {};
        if (filters.type)
            q.type = filters.type;
        if (filters.fromYear != null || filters.toYear != null) {
            q.eventYear = {};
            if (filters.fromYear != null)
                q.eventYear.$gte = filters.fromYear;
            if (filters.toYear != null)
                q.eventYear.$lte = filters.toYear;
        }
        if (filters.search)
            q.$or = [
                { name: { $regex: filters.search, $options: 'i' } },
                { description: { $regex: filters.search, $options: 'i' } },
                { tags: { $regex: filters.search, $options: 'i' } },
            ];
        return this.model.find(q).sort({ eventYear: -1, name: 1 }).lean().exec();
    }
    async upsertMany(records) {
        const operations = records.map((record) => ({
            updateOne: {
                filter: { sourceId: record.sourceId },
                update: { $set: record },
                upsert: true,
            },
        }));
        if (!operations.length)
            return { upserted: 0, modified: 0 };
        const result = await this.model.bulkWrite(operations);
        return { upserted: result.upsertedCount, modified: result.modifiedCount };
    }
    async seedDefaults() {
        const result = await this.upsertMany(historical_data_1.historicalData);
        return result;
    }
    async count() {
        return this.model.countDocuments().exec();
    }
};
exports.HistoricalService = HistoricalService;
exports.HistoricalService = HistoricalService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(historical_reference_schema_1.HistoricalReference.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], HistoricalService);
//# sourceMappingURL=historical.service.js.map