"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const mail_service_1 = require("./mail.service");
const mail_events_service_1 = require("./mail-events.service");
const mail_processor_1 = require("./mail.processor");
const mail_controller_1 = require("./mail.controller");
const email_recipients_service_1 = require("./email-recipients.service");
const email_log_service_1 = require("./email-log.service");
const email_recipient_schema_1 = require("./schemas/email-recipient.schema");
const email_log_schema_1 = require("./schemas/email-log.schema");
const notifications_module_1 = require("../notifications/notifications.module");
const audit_module_1 = require("../audit/audit.module");
let MailModule = class MailModule {
};
exports.MailModule = MailModule;
exports.MailModule = MailModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: email_recipient_schema_1.EmailRecipient.name, schema: email_recipient_schema_1.EmailRecipientSchema },
                { name: email_log_schema_1.EmailLog.name, schema: email_log_schema_1.EmailLogSchema },
            ]),
            bullmq_1.BullModule.registerQueue({ name: 'mail' }),
            notifications_module_1.NotificationsModule,
            audit_module_1.AuditModule,
        ],
        providers: [mail_service_1.MailService, mail_events_service_1.MailEventsService, mail_processor_1.MailQueueProcessor, email_recipients_service_1.EmailRecipientsService, email_log_service_1.EmailLogService],
        controllers: [mail_controller_1.MailController],
        exports: [mail_service_1.MailService, mail_events_service_1.MailEventsService, email_recipients_service_1.EmailRecipientsService, email_log_service_1.EmailLogService],
    })
], MailModule);
//# sourceMappingURL=mail.module.js.map