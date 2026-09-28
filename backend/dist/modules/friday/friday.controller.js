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
exports.FridayController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const intent_parser_service_1 = require("./intent-parser.service");
const command_executor_service_1 = require("./command-executor.service");
const learning_service_1 = require("./learning.service");
const audit_service_1 = require("../audit/audit.service");
const elevenlabs_service_1 = require("./elevenlabs.service");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
let FridayController = class FridayController {
    constructor(intentParser, commandExecutor, learningService, auditService, elevenLabs) {
        this.intentParser = intentParser;
        this.commandExecutor = commandExecutor;
        this.learningService = learningService;
        this.auditService = auditService;
        this.elevenLabs = elevenLabs;
    }
    async command(user, body) {
        if (!body.transcript || !body.transcript.trim()) {
            throw new common_1.BadRequestException({ success: false, error: { code: 'TRANSCRIPT_REQUIRED', message: 'transcript is required.' } });
        }
        if (body.confirm && body.interactionId) {
            const pending = await this.learningService.findById(body.interactionId);
            if (!pending || pending.status !== 'PENDING_CONFIRMATION' || String(pending.userId) !== user.userId) {
                throw new common_1.BadRequestException({ success: false, error: { code: 'INVALID_CONFIRMATION', message: 'No matching pending command to confirm.' } });
            }
            const parsed = { intent: pending.intent, parameters: pending.parameters, isDestructive: true, confidence: 1 };
            const result = await this.commandExecutor.execute(user, parsed);
            await this.learningService.updateInteraction(body.interactionId, {
                status: result.success ? 'EXECUTED' : 'FAILED',
                spokenResponse: result.spokenResponse,
                resultData: result.data,
            });
            await this.auditService.record({
                userId: user.userId, userEmail: user.email, userRole: user.role,
                action: 'FRIDAY_COMMAND_CONFIRMED', category: 'FRIDAY', targetId: body.interactionId,
                metadata: { intent: pending.intent, parameters: pending.parameters },
            });
            const suggestion = await this.learningService.proactiveSuggestion(user.userId, pending.intent);
            return { success: true, data: { requiresConfirmation: false, ...result, suggestion } };
        }
        const parsed = this.intentParser.parse(body.transcript);
        if (parsed.isDestructive) {
            const pending = await this.learningService.logInteraction({
                userId: user.userId,
                transcript: body.transcript,
                intent: parsed.intent,
                parameters: parsed.parameters,
                status: 'PENDING_CONFIRMATION',
                requiredConfirmation: true,
                spokenResponse: `This action requires confirmation: ${this.describeIntent(parsed.intent, parsed.parameters)}. Say confirm to proceed.`,
                resultData: {},
            });
            await this.auditService.record({
                userId: user.userId, userEmail: user.email, userRole: user.role,
                action: 'FRIDAY_CONFIRMATION_REQUESTED', category: 'FRIDAY', targetId: String(pending._id),
                metadata: { intent: parsed.intent, parameters: parsed.parameters },
            });
            return {
                success: true,
                data: {
                    requiresConfirmation: true,
                    interactionId: String(pending._id),
                    spokenResponse: pending.spokenResponse,
                    intent: parsed.intent,
                    parameters: parsed.parameters,
                },
            };
        }
        const result = await this.commandExecutor.execute(user, parsed);
        const interaction = await this.learningService.logInteraction({
            userId: user.userId,
            transcript: body.transcript,
            intent: parsed.intent,
            parameters: parsed.parameters,
            status: result.success ? 'EXECUTED' : 'FAILED',
            requiredConfirmation: false,
            spokenResponse: result.spokenResponse,
            resultData: result.data,
        });
        await this.auditService.record({
            userId: user.userId, userEmail: user.email, userRole: user.role,
            action: 'FRIDAY_COMMAND_EXECUTED', category: 'FRIDAY', targetId: String(interaction._id),
            metadata: { intent: parsed.intent, parameters: parsed.parameters, success: result.success },
        });
        const suggestion = parsed.intent !== 'UNKNOWN' ? await this.learningService.proactiveSuggestion(user.userId, parsed.intent) : null;
        return { success: true, data: { requiresConfirmation: false, ...result, intent: parsed.intent, suggestion } };
    }
    voiceStatus() {
        return {
            success: true,
            data: {
                configured: this.elevenLabs.isConfigured(),
                provider: 'ElevenLabs',
                sttModel: 'scribe_v2',
                ttsModel: 'eleven_multilingual_v2',
                voice: 'configured female voice',
            },
        };
    }
    async speechToText(audio) {
        if (!audio?.buffer?.length) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'AUDIO_REQUIRED', message: 'Audio file is required.' },
            });
        }
        const transcript = await this.elevenLabs.transcribe(audio.buffer, audio.mimetype || 'audio/webm');
        if (!transcript.text) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'EMPTY_TRANSCRIPT', message: 'No speech was detected.' },
            });
        }
        return { success: true, data: transcript };
    }
    async textToSpeech(body, res) {
        if (!body?.text?.trim()) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'TEXT_REQUIRED', message: 'text is required.' },
            });
        }
        const audio = await this.elevenLabs.synthesize(body.text.trim());
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'no-store');
        res.send(audio);
    }
    async voiceCommand(user, audio) {
        if (!audio?.buffer?.length) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'AUDIO_REQUIRED', message: 'Audio file is required.' },
            });
        }
        const transcript = await this.elevenLabs.transcribe(audio.buffer, audio.mimetype || 'audio/webm');
        if (!transcript.text) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'EMPTY_TRANSCRIPT', message: 'No speech was detected.' },
            });
        }
        const result = await this.command(user, { transcript: transcript.text });
        return {
            ...result,
            data: {
                ...(result.data || {}),
                transcript: transcript.text,
                languageCode: transcript.languageCode,
            },
        };
    }
    async history(userId, limit = '30') {
        const data = await this.learningService.history(userId, parseInt(limit, 10));
        return { success: true, data };
    }
    async insights(userId) {
        const [frequentCommands, frequentlyViewedClasses] = await Promise.all([
            this.learningService.frequentCommands(userId),
            this.learningService.frequentlyViewedClasses(userId),
        ]);
        return {
            success: true,
            data: {
                frequentCommands,
                frequentlyViewedClasses,
                note: 'Computed from your own logged FRIDAY command history only.',
            },
        };
    }
    describeIntent(intent, params) {
        switch (intent) {
            case 'START_PROCESSING':
                return `start processing survey ${params.surveyCode || '(unspecified)'}`;
            case 'SEND_REPORT':
                return `email the report for survey ${params.surveyCode || '(unspecified)'} to the authorized recipients`;
            case 'VERIFY_ANOMALY':
                return `mark anomaly ${params.anomalyCode || '(unspecified)'} as verified`;
            default:
                return intent;
        }
    }
};
exports.FridayController = FridayController;
__decorate([
    (0, common_1.Post)('command'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FridayController.prototype, "command", null);
__decorate([
    (0, common_1.Get)('voice-status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], FridayController.prototype, "voiceStatus", null);
__decorate([
    (0, common_1.Post)('stt'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 25 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FridayController.prototype, "speechToText", null);
__decorate([
    (0, common_1.Post)('tts'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FridayController.prototype, "textToSpeech", null);
__decorate([
    (0, common_1.Post)('voice-command'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('audio', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 25 * 1024 * 1024 },
    })),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FridayController.prototype, "voiceCommand", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FridayController.prototype, "history", null);
__decorate([
    (0, common_1.Get)('insights'),
    __param(0, (0, current_user_decorator_1.CurrentUser)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FridayController.prototype, "insights", null);
exports.FridayController = FridayController = __decorate([
    (0, swagger_1.ApiTags)('friday'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('friday'),
    __metadata("design:paramtypes", [intent_parser_service_1.IntentParserService,
        command_executor_service_1.CommandExecutorService,
        learning_service_1.LearningService,
        audit_service_1.AuditService,
        elevenlabs_service_1.ElevenLabsService])
], FridayController);
//# sourceMappingURL=friday.controller.js.map