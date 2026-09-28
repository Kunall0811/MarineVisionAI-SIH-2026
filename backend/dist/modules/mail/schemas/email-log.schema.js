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
exports.EmailLogSchema = exports.EmailLog = void 0;
const mongoose_1 = require("@nestjs/mongoose");
let EmailLog = class EmailLog {
};
exports.EmailLog = EmailLog;
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmailLog.prototype, "to", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], EmailLog.prototype, "subject", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, index: true }),
    __metadata("design:type", String)
], EmailLog.prototype, "triggerEvent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ enum: ['SENT', 'LOGGED_ONLY', 'FAILED'], required: true, index: true }),
    __metadata("design:type", String)
], EmailLog.prototype, "status", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmailLog.prototype, "messageId", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmailLog.prototype, "errorMessage", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: Object, default: {} }),
    __metadata("design:type", Object)
], EmailLog.prototype, "metadata", void 0);
exports.EmailLog = EmailLog = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'email_logs' })
], EmailLog);
exports.EmailLogSchema = mongoose_1.SchemaFactory.createForClass(EmailLog);
exports.EmailLogSchema.index({ createdAt: -1 });
//# sourceMappingURL=email-log.schema.js.map