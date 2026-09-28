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
exports.EmailRecipientsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const email_recipient_schema_1 = require("./schemas/email-recipient.schema");
let EmailRecipientsService = class EmailRecipientsService {
    constructor(model) {
        this.model = model;
    }
    create(data) {
        return this.model.create(data);
    }
    findAll(activeOnly = false) {
        const filter = activeOnly ? { isActive: true } : {};
        return this.model.find(filter).sort({ createdAt: -1 }).exec();
    }
    findByEvent(event) {
        return this.model.find({ isActive: true, subscribedEvents: event }).exec();
    }
    update(id, update) {
        return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    delete(id) {
        return this.model.findByIdAndDelete(id).exec();
    }
};
exports.EmailRecipientsService = EmailRecipientsService;
exports.EmailRecipientsService = EmailRecipientsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(email_recipient_schema_1.EmailRecipient.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], EmailRecipientsService);
//# sourceMappingURL=email-recipients.service.js.map