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
exports.CommandExecutorService = void 0;
const common_1 = require("@nestjs/common");
const surveys_service_1 = require("../surveys/surveys.service");
const detections_service_1 = require("../detections/detections.service");
const sonar_service_1 = require("../sonar/sonar.service");
const reports_service_1 = require("../reports/reports.service");
const mail_events_service_1 = require("../mail/mail-events.service");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
let CommandExecutorService = class CommandExecutorService {
    constructor(surveysService, detectionsService, sonarService, reportsService, mailEvents, realtime, processingQueue) {
        this.surveysService = surveysService;
        this.detectionsService = detectionsService;
        this.sonarService = sonarService;
        this.reportsService = reportsService;
        this.mailEvents = mailEvents;
        this.realtime = realtime;
        this.processingQueue = processingQueue;
    }
    async execute(user, parsed) {
        switch (parsed.intent) {
            case 'COUNT_UNVERIFIED':
                return this.countUnverified();
            case 'SHOW_ANOMALIES':
                return this.showAnomalies(user, parsed.parameters);
            case 'OPEN_ANOMALY':
                return this.openAnomaly(user, parsed.parameters);
            case 'ZOOM_GLOBE':
                return this.zoomGlobe(parsed.parameters);
            case 'START_PROCESSING':
                return this.startProcessing(user, parsed.parameters);
            case 'GENERATE_REPORT':
                return this.generateReport(user, parsed.parameters);
            case 'SEND_REPORT':
                return this.sendReport(user, parsed.parameters);
            case 'VERIFY_ANOMALY':
                return this.verifyAnomaly(user, parsed.parameters);
            case 'FRIDAY_ON':
                return {
                    success: true,
                    spokenResponse: 'FRIDAY is now online and ready to assist. How can I help you?',
                    data: { action: 'FRIDAY_ON' },
                };
            case 'FRIDAY_OFF':
                return {
                    success: true,
                    spokenResponse: 'FRIDAY going offline. Goodbye.',
                    data: { action: 'FRIDAY_OFF' },
                };
            case 'NAVIGATE':
                return {
                    success: true,
                    spokenResponse: `Switching to ${parsed.parameters.label || 'that panel'}.`,
                    data: { action: 'NAVIGATE', route: parsed.parameters.route },
                };
            case 'HELP':
                return {
                    success: true,
                    spokenResponse: "I'm FRIDAY, your MarineVision AI command agent. I can switch panels — say 'switch to Globe' or 'switch to Analytics'. I can show anomalies, open detections, start processing, generate reports, verify anomalies, train or test the AI model, and more. Just ask!",
                    data: { action: 'NONE' },
                };
            default:
                return {
                    success: false,
                    spokenResponse: "I didn't understand that command. Try something like 'show all high-risk ghost nets' or say 'help' to hear what I can do.",
                    data: { action: 'NONE' },
                };
        }
    }
    async countUnverified() {
        const { total } = await this.detectionsService.findAll({ status: 'PENDING_REVIEW' }, 1, 1);
        return {
            success: true,
            spokenResponse: `There ${total === 1 ? 'is' : 'are'} currently ${total} unverified detection${total === 1 ? '' : 's'} pending review.`,
            data: { action: 'NONE', count: total },
        };
    }
    async showAnomalies(user, params) {
        const filter = {};
        if (params.riskLevel)
            filter.riskLevel = params.riskLevel;
        if (params.class)
            filter.class = params.class;
        const { items, total } = await this.detectionsService.findAll(filter, 1, 50);
        const descriptors = [params.riskLevel, params.class?.replace(/_/g, ' '), params.region ? `in ${params.region}` : null]
            .filter(Boolean)
            .join(' ');
        return {
            success: true,
            spokenResponse: total > 0
                ? `Found ${total} ${descriptors || ''} anomal${total === 1 ? 'y' : 'ies'}. Opening the review queue.`.replace('  ', ' ')
                : `No anomalies matched ${descriptors || 'that filter'} right now.`,
            data: { action: 'NAVIGATE', route: '/anomaly-review', filter, detectionIds: items.map((d) => String(d._id)) },
        };
    }
    async openAnomaly(user, params) {
        let detection = null;
        if (params.which === 'LATEST') {
            const { items } = await this.detectionsService.findAll({}, 1, 1);
            detection = items[0] || null;
        }
        else {
            const { items } = await this.detectionsService.findAll({ anomalyCode: params.which }, 1, 1);
            detection = items[0] || null;
        }
        if (!detection) {
            return { success: false, spokenResponse: "I couldn't find that anomaly.", data: { action: 'NONE' } };
        }
        return {
            success: true,
            spokenResponse: `Opening ${detection.anomalyCode}, a ${detection.class.replace(/_/g, ' ')} classified as ${detection.riskLevel} risk.`,
            data: { action: 'OPEN_DETECTION', detectionId: String(detection._id), anomalyCode: detection.anomalyCode },
        };
    }
    async zoomGlobe(params) {
        let detection = null;
        if (params.anomalyCode && params.anomalyCode !== 'CURRENT') {
            const { items } = await this.detectionsService.findAll({ anomalyCode: params.anomalyCode }, 1, 1);
            detection = items[0] || null;
        }
        if (!detection) {
            return {
                success: true,
                spokenResponse: 'Zooming to the currently selected anomaly on the globe.',
                data: { action: 'ZOOM_GLOBE', target: 'CURRENT' },
            };
        }
        return {
            success: true,
            spokenResponse: `Flying the globe to ${detection.anomalyCode}.`,
            data: {
                action: 'ZOOM_GLOBE',
                target: { latitude: detection.latitude, longitude: detection.longitude, anomalyCode: detection.anomalyCode },
            },
        };
    }
    async startProcessing(user, params) {
        if (!params.surveyCode) {
            return { success: false, spokenResponse: 'Which survey would you like me to process? Please include the survey code.', data: { action: 'NONE' } };
        }
        const survey = await this.surveysService.findByCode(params.surveyCode);
        if (!survey) {
            return { success: false, spokenResponse: `I couldn't find a survey with code ${params.surveyCode}.`, data: { action: 'NONE' } };
        }
        if (user.role === 'OPERATOR' && !this.surveysService.isOperatorAssigned(survey, user.userId)) {
            return { success: false, spokenResponse: 'You are not assigned to that survey, so I cannot start processing it.', data: { action: 'NONE' } };
        }
        if (user.role === 'OPERATOR' && user.operatorPermissions?.canProcess === false) {
            return { success: false, spokenResponse: 'Your account does not have processing permission.', data: { action: 'NONE' } };
        }
        let queued = 0;
        let page = 1;
        while (true) {
            const [frames, total] = await this.sonarService.findBySurvey(String(survey._id), page, 100, { processingStatus: 'QUEUED' });
            if (!frames.length)
                break;
            for (const frame of frames) {
                await this.processingQueue.add('process-frame', { frameId: String(frame._id) });
                queued++;
            }
            if (page * 100 >= total)
                break;
            page++;
        }
        await this.surveysService.update(String(survey._id), { status: 'PROCESSING' });
        return {
            success: true,
            spokenResponse: queued > 0
                ? `Starting processing for survey ${survey.code}. I've queued ${queued} frame${queued === 1 ? '' : 's'}, you'll see live progress on the dashboard.`
                : `Survey ${survey.code} has no queued frames to process right now.`,
            data: { action: 'START_PROCESSING', surveyId: String(survey._id), surveyCode: survey.code, queued },
        };
    }
    async generateReport(user, params) {
        if (!params.surveyCode) {
            return { success: false, spokenResponse: 'Which survey should I generate the report for?', data: { action: 'NONE' } };
        }
        const survey = await this.surveysService.findByCode(params.surveyCode);
        if (!survey) {
            return { success: false, spokenResponse: `I couldn't find a survey with code ${params.surveyCode}.`, data: { action: 'NONE' } };
        }
        if (user.role === 'OPERATOR') {
            if (!this.surveysService.isOperatorAssigned(survey, user.userId)) {
                return { success: false, spokenResponse: 'You are not assigned to that survey.', data: { action: 'NONE' } };
            }
            if (user.operatorPermissions?.canGenerateReports === false) {
                return { success: false, spokenResponse: 'Your account does not have report-generation permission.', data: { action: 'NONE' } };
            }
        }
        const format = params.format || 'PDF';
        const report = await this.reportsService.generate(String(survey._id), format, user.userId);
        this.realtime.emitEvent('report_generated', { reportId: report._id, surveyId: survey._id, format });
        return {
            success: true,
            spokenResponse: `${format} report generated for ${survey.code} with ${report.detectionCount} detections. You can download it from the Reports page.`,
            data: { action: 'OPEN_REPORT', reportId: String(report._id) },
        };
    }
    async sendReport(user, params) {
        if (!params.surveyCode) {
            return { success: false, spokenResponse: 'Which survey report should I send?', data: { action: 'NONE' } };
        }
        const survey = await this.surveysService.findByCode(params.surveyCode);
        if (!survey) {
            return { success: false, spokenResponse: `I couldn't find a survey with code ${params.surveyCode}.`, data: { action: 'NONE' } };
        }
        await this.mailEvents.dispatch('REPORT_GENERATED', `Survey report requested via FRIDAY: ${survey.code}`, `<p>Report for survey ${survey.name} (${survey.code}) requested via FRIDAY voice command by ${user.email}.</p>`, `Report for survey ${survey.name} (${survey.code}) requested via FRIDAY by ${user.email}.`, { surveyId: String(survey._id), viaFriday: true, severity: 'INFO' });
        return {
            success: true,
            spokenResponse: `Sending the report for ${survey.code} to the authorized recipients now.`,
            data: { action: 'NONE' },
        };
    }
    async verifyAnomaly(user, params) {
        if (user.role === 'OPERATOR' && user.operatorPermissions?.canVerifyDetections === false) {
            return { success: false, spokenResponse: 'Your account does not have permission to verify detections.', data: { action: 'NONE' } };
        }
        if (!params.anomalyCode || params.anomalyCode === 'CURRENT') {
            return {
                success: true,
                spokenResponse: 'Please confirm which anomaly to verify, or open one first.',
                data: { action: 'NONE' },
            };
        }
        const { items } = await this.detectionsService.findAll({ anomalyCode: params.anomalyCode }, 1, 1);
        const detection = items[0];
        if (!detection) {
            return { success: false, spokenResponse: `I couldn't find anomaly ${params.anomalyCode}.`, data: { action: 'NONE' } };
        }
        const updated = await this.detectionsService.verify(String(detection._id), user.userId, 'Verified via FRIDAY voice command.');
        this.realtime.emitEvent('verification_completed', { detectionId: detection._id, status: 'VERIFIED' });
        return {
            success: true,
            spokenResponse: `${params.anomalyCode} has been marked as verified.`,
            data: { action: 'NONE', detectionId: String(detection._id), status: updated?.status },
        };
    }
};
exports.CommandExecutorService = CommandExecutorService;
exports.CommandExecutorService = CommandExecutorService = __decorate([
    (0, common_1.Injectable)(),
    __param(6, (0, bullmq_1.InjectQueue)('sonar-processing')),
    __metadata("design:paramtypes", [surveys_service_1.SurveysService,
        detections_service_1.DetectionsService,
        sonar_service_1.SonarService,
        reports_service_1.ReportsService,
        mail_events_service_1.MailEventsService,
        realtime_gateway_1.RealtimeGateway,
        bullmq_2.Queue])
], CommandExecutorService);
//# sourceMappingURL=command-executor.service.js.map