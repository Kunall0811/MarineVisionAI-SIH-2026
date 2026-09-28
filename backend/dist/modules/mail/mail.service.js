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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const nodemailer = __importStar(require("nodemailer"));
let MailService = class MailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger('MailService');
        this.transporter = null;
        const smtp = this.config.get('smtp');
        this.configured = smtp?.configured;
        this.fromAddress = smtp?.user ? `MarineVision AI <${smtp.user}>` : (smtp?.from || 'MarineVision AI <no-reply@marinevision.ai>');
        if (this.configured) {
            this.transporter = nodemailer.createTransport({
                host: smtp.host,
                port: smtp.port,
                secure: smtp.secure,
                auth: { user: smtp.user, pass: smtp.password },
                tls: { rejectUnauthorized: false },
            });
            this.logger.log(`SMTP configured for ${smtp.host}:${smtp.port} using account ${smtp.user}`);
        }
        else {
            this.logger.warn('SMTP is not configured (SMTP_HOST/SMTP_USER missing). Emails will be logged, not sent.');
        }
    }
    async send(options) {
        if (!this.configured || !this.transporter) {
            this.logger.log(`[EMAIL NOT SENT - SMTP NOT CONFIGURED] To: ${options.to} | Subject: ${options.subject}`);
            return { status: 'LOGGED_ONLY' };
        }
        try {
            const info = await this.transporter.sendMail({
                from: this.fromAddress,
                to: Array.isArray(options.to) ? options.to.join(',') : options.to,
                subject: options.subject,
                html: options.html,
                text: options.text,
                attachments: options.attachments,
            });
            this.logger.log(`Email successfully delivered to ${Array.isArray(options.to) ? options.to.join(',') : options.to} [MsgId: ${info.messageId}]`);
            return { status: 'SENT', messageId: info.messageId };
        }
        catch (err) {
            this.logger.error(`Error sending email via SMTP: ${err.message}`);
            return { status: 'FAILED', messageId: err.message };
        }
    }
    async sendVerificationEmail(to, fullName, verifyUrl) {
        return this.send({
            to,
            subject: 'Verify your MarineVision AI account',
            html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#0e7490">MarineVision AI</h2>
          <p>Hi ${fullName},</p>
          <p>Please verify your account to activate access to the marine monitoring platform.</p>
          <p><a href="${verifyUrl}" style="background:#0e7490;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Verify Email</a></p>
          <p>If the button doesn't work, copy this link into your browser:<br/>${verifyUrl}</p>
          <p style="color:#888;font-size:12px">This link expires in 24 hours.</p>
        </div>`,
        });
    }
    async sendPasswordResetEmail(to, fullName, resetUrl) {
        return this.send({
            to,
            subject: 'Reset your MarineVision AI password',
            html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto">
          <h2 style="color:#0e7490">MarineVision AI</h2>
          <p>Hi ${fullName},</p>
          <p>We received a request to reset your password.</p>
          <p><a href="${resetUrl}" style="background:#0e7490;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">Reset Password</a></p>
          <p>If you did not request this, you can ignore this email.</p>
          <p style="color:#888;font-size:12px">This link expires in 1 hour.</p>
        </div>`,
        });
    }
    async sendHighRiskAlertEmail(to, anomaly) {
        return this.send({
            to,
            subject: `URGENT MARINE ANOMALY DETECTED - ${anomaly.class}`,
            html: `
        <div style="font-family:sans-serif;max-width:560px;margin:auto">
          <h2 style="color:#b91c1c">High-Risk Anomaly Detected</h2>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:4px 0"><b>Survey</b></td><td>${anomaly.surveyName}</td></tr>
            <tr><td style="padding:4px 0"><b>Classification</b></td><td>${anomaly.class}</td></tr>
            <tr><td style="padding:4px 0"><b>AI Confidence</b></td><td>${anomaly.confidence}%</td></tr>
            <tr><td style="padding:4px 0"><b>Coordinates</b></td><td>${anomaly.latitude ?? 'N/A'} , ${anomaly.longitude ?? 'N/A'}</td></tr>
            <tr><td style="padding:4px 0"><b>Depth</b></td><td>${anomaly.depth ?? 'N/A'} m</td></tr>
            <tr><td style="padding:4px 0"><b>Location Status</b></td><td>${anomaly.locationStatus}</td></tr>
            <tr><td style="padding:4px 0"><b>Status</b></td><td>${anomaly.status}</td></tr>
          </table>
          <p style="color:#888;font-size:12px">This alert was generated automatically by MarineVision AI based on system-configured risk rules. It requires expert verification before any operational action.</p>
        </div>`,
        });
    }
    async sendDatasetSubmissionEmail(to, data) {
        return this.send({
            to,
            subject: `[MarineVision AI] Dataset Submitted for Review: ${data.datasetName} (${data.imageCount} images)`,
            html: `
        <div style="font-family:sans-serif;max-width:600px;margin:auto;background:#0f172a;color:#f8fafc;padding:24px;border-radius:8px;border:1px solid #1e293b">
          <div style="border-bottom:2px solid #06b6d4;padding-bottom:12px;margin-bottom:16px">
            <h2 style="color:#38bdf8;margin:0;font-size:20px">MarineVision AI — Sonar Dataset Submission</h2>
            <p style="color:#94a3b8;margin:4px 0 0 0;font-size:13px">Operator Submission for Admin Review & Model Training</p>
          </div>
          <table style="width:100%;border-collapse:collapse;color:#e2e8f0;font-size:14px;margin-bottom:20px">
            <tr><td style="padding:6px 0;color:#94a3b8">Submission ID:</td><td style="padding:6px 0;font-family:monospace;color:#38bdf8"><b>${data.submissionId}</b></td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8">Dataset Name:</td><td style="padding:6px 0"><b>${data.datasetName}</b></td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8">Submitted By:</td><td style="padding:6px 0">${data.operatorName}</td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8">Total Sonar Images:</td><td style="padding:6px 0;color:#22c55e"><b>${data.imageCount}</b> frames</td></tr>
            <tr><td style="padding:6px 0;color:#94a3b8">Target Classes:</td><td style="padding:6px 0">${data.classes.join(', ')}</td></tr>
            ${data.notes ? `<tr><td style="padding:6px 0;color:#94a3b8">Notes:</td><td style="padding:6px 0">${data.notes}</td></tr>` : ''}
          </table>
          <div style="margin:24px 0;text-align:center">
            <a href="${data.reviewUrl}" style="background:#0284c7;color:#ffffff;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;display:inline-block">Open Admin Dataset Review</a>
          </div>
          <p style="color:#64748b;font-size:12px;margin-top:20px;border-top:1px solid #1e293b;padding-top:12px">
            This notification was generated automatically by MarineVision AI SIH26057. The dataset and its annotations can be inspected, verified, corrected, or incorporated into active learning models.
          </p>
        </div>`,
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map