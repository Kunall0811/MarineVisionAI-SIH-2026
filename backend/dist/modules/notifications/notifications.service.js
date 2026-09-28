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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const notification_schema_1 = require("./schemas/notification.schema");
const users_service_1 = require("../users/users.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let NotificationsService = class NotificationsService {
    constructor(notificationModel, usersService, realtime) {
        this.notificationModel = notificationModel;
        this.usersService = usersService;
        this.realtime = realtime;
    }
    async createFor(recipientId, data) {
        const notification = await this.notificationModel.create({ ...data, recipientId });
        this.realtime.emitEvent('notification_created', {
            id: notification._id,
            recipientId,
            type: notification.type,
            title: notification.title,
            severity: notification.severity,
        });
        return notification;
    }
    async createForAdmins(data) {
        const [admins] = await this.usersService.findAllPaginated(1, 1000, { role: 'ADMIN', isActive: true });
        return Promise.all(admins.map((a) => this.createFor(String(a._id), data)));
    }
    async createForEveryone(data) {
        const [users] = await this.usersService.findAllPaginated(1, 1000, { isActive: true });
        return Promise.all(users.map((u) => this.createFor(String(u._id), data)));
    }
    async findForUser(userId, page = 1, limit = 30, unreadOnly = false) {
        const filter = { recipientId: userId };
        if (unreadOnly)
            filter.isRead = false;
        const skip = (page - 1) * limit;
        const [items, total, unreadCount] = await Promise.all([
            this.notificationModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.notificationModel.countDocuments(filter).exec(),
            this.notificationModel.countDocuments({ recipientId: userId, isRead: false }).exec(),
        ]);
        return { items, total, unreadCount };
    }
    markRead(id, userId) {
        return this.notificationModel.findOneAndUpdate({ _id: id, recipientId: userId }, { isRead: true }, { new: true }).exec();
    }
    markAllRead(userId) {
        return this.notificationModel.updateMany({ recipientId: userId, isRead: false }, { isRead: true }).exec();
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(notification_schema_1.Notification.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        users_service_1.UsersService,
        realtime_gateway_1.RealtimeGateway])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map