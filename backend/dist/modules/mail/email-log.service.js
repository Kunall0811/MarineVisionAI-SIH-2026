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
exports.EmailLogService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_log_schema_1 = require("./schemas/email-log.schema");
let EmailLogService = class EmailLogService {
    constructor(model) {
        this.model = model;
    }
    record(data) {
        return this.model.create(data);
    }
    async findAll(page = 1, limit = 30, filter = {}) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.model.countDocuments(filter).exec(),
        ]);
        return { items, total };
    }
};
exports.EmailLogService = EmailLogService;
exports.EmailLogService = EmailLogService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(email_log_schema_1.EmailLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], EmailLogService);
//# sourceMappingURL=email-log.service.js.map