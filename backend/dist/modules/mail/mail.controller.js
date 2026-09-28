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
exports.MailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const email_recipients_service_1 = require("./email-recipients.service");
const email_log_service_1 = require("./email-log.service");
const audit_service_1 = require("../audit/audit.service");
let MailController = class MailController {
    constructor(recipientsService, emailLogService, auditService) {
        this.recipientsService = recipientsService;
        this.emailLogService = emailLogService;
        this.auditService = auditService;
    }
    async listRecipients() {
        const data = await this.recipientsService.findAll();
        return { success: true, data };
    }
    async createRecipient(user, body) {
        const recipient = await this.recipientsService.create({
            name: body.name,
            email: String(body.email || '').toLowerCase().trim(),
            organization: body.organization || '',
            subscribedEvents: body.subscribedEvents || undefined,
            addedBy: user.userId,
        });
        await this.auditService.record({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: 'EMAIL_RECIPIENT_ADDED',
            category: 'MAIL',
            targetType: 'EmailRecipient',
            targetId: String(recipient._id),
            metadata: { email: recipient.email },
        });
        return { success: true, data: recipient };
    }
    async updateRecipient(user, id, body) {
        const allowed = ['name', 'email', 'organization', 'subscribedEvents', 'isActive'];
        const update = {};
        for (const key of allowed)
            if (body[key] !== undefined)
                update[key] = body[key];
        const recipient = await this.recipientsService.update(id, update);
        await this.auditService.record({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: 'EMAIL_RECIPIENT_UPDATED',
            category: 'MAIL',
            targetType: 'EmailRecipient',
            targetId: id,
            metadata: update,
        });
        return { success: true, data: recipient };
    }
    async removeRecipient(user, id) {
        await this.recipientsService.delete(id);
        await this.auditService.record({
            userId: user.userId,
            userEmail: user.email,
            userRole: user.role,
            action: 'EMAIL_RECIPIENT_REMOVED',
            category: 'MAIL',
            targetType: 'EmailRecipient',
            targetId: id,
        });
        return { success: true, data: { id } };
    }
    async logs(page = '1', limit = '30', triggerEvent) {
        const filter = {};
        if (triggerEvent)
            filter.triggerEvent = triggerEvent;
        const { items, total } = await this.emailLogService.findAll(parseInt(page, 10), parseInt(limit, 10), filter);
        return { success: true, data: items, meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } };
    }
};
exports.MailController = MailController;
__decorate([
    (0, common_1.Get)('recipients'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MailController.prototype, "listRecipients", null);
__decorate([
    (0, common_1.Post)('recipients'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "createRecipient", null);
__decorate([
    (0, common_1.Patch)('recipients/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "updateRecipient", null);
__decorate([
    (0, common_1.Delete)('recipients/:id'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "removeRecipient", null);
__decorate([
    (0, common_1.Get)('logs'),
    (0, roles_decorator_1.Roles)('ADMIN'),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('triggerEvent')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], MailController.prototype, "logs", null);
exports.MailController = MailController = __decorate([
    (0, swagger_1.ApiTags)('mail'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('mail'),
    __metadata("design:paramtypes", [email_recipients_service_1.EmailRecipientsService,
        email_log_service_1.EmailLogService,
        audit_service_1.AuditService])
], MailController);
//# sourceMappingURL=mail.controller.js.map