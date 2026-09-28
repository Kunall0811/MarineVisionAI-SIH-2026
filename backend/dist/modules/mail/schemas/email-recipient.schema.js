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
exports.EmailRecipientSchema = exports.EmailRecipient = exports.ALERT_EVENT_TYPES = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
exports.ALERT_EVENT_TYPES = [
    'HIGH_RISK_ANOMALY',
    'REPORT_GENERATED',
    'SURVEY_COMPLETED',
    'PROCESSING_FAILURE',
    'ANOMALY_VERIFIED',
];
let EmailRecipient = class EmailRecipient {
};
exports.EmailRecipient = EmailRecipient;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], EmailRecipient.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true, lowercase: true }),
    __metadata("design:type", String)
], EmailRecipient.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: '' }),
    __metadata("design:type", String)
], EmailRecipient.prototype, "organization", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], enum: exports.ALERT_EVENT_TYPES, default: exports.ALERT_EVENT_TYPES }),
    __metadata("design:type", Array)
], EmailRecipient.prototype, "subscribedEvents", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], EmailRecipient.prototype, "isActive", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", mongoose_2.Types.ObjectId)
], EmailRecipient.prototype, "addedBy", void 0);
exports.EmailRecipient = EmailRecipient = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true, collection: 'email_recipients' })
], EmailRecipient);
exports.EmailRecipientSchema = mongoose_1.SchemaFactory.createForClass(EmailRecipient);
//# sourceMappingURL=email-recipient.schema.js.map