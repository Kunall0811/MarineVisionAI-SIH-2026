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
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const audit_log_schema_1 = require("./schemas/audit-log.schema");
let AuditService = class AuditService {
    constructor(auditModel) {
        this.auditModel = auditModel;
        this.logger = new common_1.Logger('AuditService');
    }
    async record(input) {
        try {
            return await this.auditModel.create({
                userId: input.userId,
                userEmail: input.userEmail,
                userRole: input.userRole,
                action: input.action,
                category: input.category,
                targetType: input.targetType || '',
                targetId: input.targetId || null,
                metadata: input.metadata || {},
                ipAddress: input.ipAddress || '',
                outcome: input.outcome || 'SUCCESS',
            });
        }
        catch (err) {
            this.logger.error(`Failed to write audit log for action=${input.action}: ${err.message}`);
            return null;
        }
    }
    async findAll(filter = {}, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.auditModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.auditModel.countDocuments(filter).exec(),
        ]);
        return { items, total };
    }
    async categories() {
        return this.auditModel.distinct('category').exec();
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(audit_log_schema_1.AuditLog.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AuditService);
//# sourceMappingURL=audit.service.js.map