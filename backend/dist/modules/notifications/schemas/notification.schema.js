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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationSchema = exports.Notification = exports.NOTIFICATION_TYPES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.NOTIFICATION_TYPES = [
    'HIGH_RISK_ANOMALY',
    'REPORT_GENERATED',
    'SURVEY_COMPLETED',
    'PROCESSING_FAILURE',
    'ANOMALY_VERIFIED',
    'FRIDAY_SUGGESTION',
    'SYSTEM',
    'DATASET_SUBMITTED',
    'DATASET_REVIEWED',
    'COORDINATE_UPDATED',
];
let Notification = class Notification {
};
exports.Notification = Notification;
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', default: null, index: true }),
    __metadata("design:type", Object)
], Notification.prototype, "recipientId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, enum: exports.NOTIFICATION_TYPES, index: true }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Notification.prototype, "title", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], Notification.prototype, "message", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO'], default: 'INFO' }),
    __metadata("design:type", String)
], Notification.prototype, "severity", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], Notification.prototype, "metadata", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: false, index: true }),
    __metadata("design:type", Boolean)
], Notification.prototype, "isRead", void 0);
exports.Notification = Notification = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'notifications' })
], Notification);
exports.NotificationSchema = mongoose_1.SchemaFactory.createForClass(Notification);
exports.NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
//# sourceMappingURL=notification.schema.js.map