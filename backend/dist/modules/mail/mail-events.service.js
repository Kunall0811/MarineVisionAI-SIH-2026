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
exports.MailEventsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const mail_service_1 = require("./mail.service");
const email_log_service_1 = require("./email-log.service");
const notifications_service_1 = require("../notifications/notifications.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let MailEventsService = class MailEventsService {
    constructor(mailQueue, mailService, emailLogService, notificationsService, realtime) {
        this.mailQueue = mailQueue;
        this.mailService = mailService;
        this.emailLogService = emailLogService;
        this.notificationsService = notificationsService;
        this.realtime = realtime;
        this.logger = new common_1.Logger('MailEventsService');
    }
    async dispatch(event, subject, html, text, metadata = {}) {
        try {
            await Promise.race([
                this.mailQueue.add('send-event-email', { event, subject, html, text, metadata }, { removeOnComplete: true, removeOnFail: 100, attempts: 2, backoff: { type: 'exponential', delay: 2000 } }),
                new Promise((_, reject) => setTimeout(() => reject(new Error('QUEUE_TIMEOUT')), 1000)),
            ]);
        }
        catch (queueErr) {
            this.logger.log(`Dispatching email directly (Redis offline or queue unavailable: ${queueErr.message})`);
            let toList = [];
            if (metadata?.recipientEmails && Array.isArray(metadata.recipientEmails)) {
                toList = metadata.recipientEmails;
            }
            else if (metadata?.recipientEmail) {
                toList = [metadata.recipientEmail];
            }
            if (toList.length === 0) {
                toList = ['asonawane260686@gmail.com'];
            }
            const attachments = [];
            if (metadata?.reportPath) {
                try {
                    const fs = await Promise.resolve().then(() => __importStar(require('fs')));
                    if (fs.existsSync(metadata.reportPath)) {
                        attachments.push({
                            filename: metadata.fileName || 'MarineVision_Report.pdf',
                            path: metadata.reportPath,
                        });
                    }
                }
                catch { }
            }
            try {
                const result = await this.mailService.send({ to: toList, subject, html, text, attachments });
                await this.emailLogService.record({
                    to: toList.join(', '),
                    subject,
                    triggerEvent: event,
                    status: result.status,
                    messageId: result.messageId || '',
                    metadata,
                });
                this.realtime.emitEvent('email_sent', { event, to: toList, status: result.status, subject });
                await this.notificationsService.createForAdmins({
                    type: event,
                    title: subject,
                    message: text?.slice(0, 280) || subject,
                    severity: metadata?.severity || 'INFO',
                    metadata,
                });
            }
            catch (err) {
                this.logger.error(`Direct email dispatch failed: ${err.message}`);
            }
        }
    }
};
exports.MailEventsService = MailEventsService;
exports.MailEventsService = MailEventsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('mail')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        mail_service_1.MailService,
        email_log_service_1.EmailLogService,
        notifications_service_1.NotificationsService,
        realtime_gateway_1.RealtimeGateway])
], MailEventsService);
//# sourceMappingURL=mail-events.service.js.map