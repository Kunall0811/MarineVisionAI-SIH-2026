"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const bcrypt = __importStar(require("bcrypt"));
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const users_service_1 = require("./users.service");
const audit_service_1 = require("../audit/audit.service");
let UsersController = class UsersController {
    constructor(usersService, auditService) {
        this.usersService = usersService;
        this.auditService = auditService;
    }
    async create(actor, body) {
        const existing = await this.usersService.findByEmail(body.email);
        if (existing) {
            throw new common_1.ConflictException({ success: false, error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with this email already exists.' } });
        }
        const passwordHash = await bcrypt.hash(body.password, 12);
        const user = await this.usersService.create({
            fullName: body.fullName,
            email: body.email.toLowerCase().trim(),
            passwordHash,
            role: body.role === 'ADMIN' ? 'ADMIN' : 'OPERATOR',
            isEmailVerified: true,
            isActive: true,
        });
        await this.auditService.record({
            userId: actor.userId, userEmail: actor.email, userRole: actor.role,
            action: 'USER_CREATED', category: 'USERS', targetType: 'User', targetId: String(user._id),
            metadata: { email: user.email, role: user.role },
        });
        return {
            success: true,
            data: { id: user._id, fullName: user.fullName, email: user.email, role: user.role, isActive: user.isActive },
        };
    }
    async list(page = '1', limit = '20') {
        const [users, total] = await this.usersService.findAllPaginated(parseInt(page, 10), parseInt(limit, 10));
        return {
            success: true,
            data: users.map((u) => ({
                id: u._id,
                fullName: u.fullName,
                email: u.email,
                role: u.role,
                isActive: u.isActive,
                isEmailVerified: u.isEmailVerified,
                operatorPermissions: u.operatorPermissions,
                lastLoginAt: u.lastLoginAt,
                createdAt: u.createdAt,
            })),
            meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) },
        };
    }
    async get(id) {
        const user = await this.usersService.findById(id);
        return { success: true, data: user };
    }
    async update(actor, id, body) {
        const allowed = ['fullName', 'role', 'isActive', 'operatorPermissions'];
        const update = {};
        for (const key of allowed) {
            if (body[key] !== undefined)
                update[key] = body[key];
        }
        const user = await this.usersService.updateById(id, update);
        await this.auditService.record({
            userId: actor.userId, userEmail: actor.email, userRole: actor.role,
            action: 'USER_UPDATED', category: 'USERS', targetType: 'User', targetId: id, metadata: update,
        });
        return { success: true, data: user };
    }
    async remove(actor, id) {
        await this.usersService.deleteById(id);
        await this.auditService.record({
            userId: actor.userId, userEmail: actor.email, userRole: actor.role,
            action: 'USER_DELETED', category: 'USERS', targetType: 'User', targetId: id,
        });
        return { success: true, data: { id } };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Post)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "remove", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('users'),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        audit_service_1.AuditService])
], UsersController);
//# sourceMappingURL=users.controller.js.map