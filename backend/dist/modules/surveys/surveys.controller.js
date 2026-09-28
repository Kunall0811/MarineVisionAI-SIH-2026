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
exports.SurveysController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const surveys_service_1 = require("./surveys.service");
const create_survey_dto_1 = require("./dto/create-survey.dto");
const realtime_gateway_1 = require("../realtime/realtime.gateway");
let SurveysController = class SurveysController {
    constructor(surveysService, realtime) {
        this.surveysService = surveysService;
        this.realtime = realtime;
    }
    async create(user, dto) {
        if (dto.dataType === 'HISTORICAL' && !dto.historicalSource) {
            throw new common_1.BadRequestException({
                success: false,
                error: {
                    code: 'HISTORICAL_SOURCE_REQUIRED',
                    message: 'Historical surveys must include a historicalSource (dataset/provenance).',
                },
            });
        }
        const existing = await this.surveysService.findByCode(dto.code);
        if (existing) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'SURVEY_CODE_EXISTS', message: 'A survey with this code already exists.' },
            });
        }
        let route = dto.route;
        if (!route && dto.startLat != null && dto.startLon != null) {
            const coords = [[Number(dto.startLon), Number(dto.startLat)]];
            if (dto.endLat != null && dto.endLon != null) {
                coords.push([Number(dto.endLon), Number(dto.endLat)]);
            }
            route = { type: 'LineString', coordinates: coords };
        }
        const survey = await this.surveysService.create({
            ...dto,
            route: route || { type: 'LineString', coordinates: [] },
            createdBy: user.userId,
            assignedOperators: dto.assignedOperators || [],
            surveyDate: dto.surveyDate ? new Date(dto.surveyDate) : null,
        });
        this.realtime.emitEvent('survey_started', {
            surveyId: survey._id,
            code: survey.code,
            name: survey.name,
            dataType: survey.dataType,
            route: survey.route,
        });
        return { success: true, data: survey };
    }
    async list(user, page = '1', limit = '20', status, dataType) {
        const filter = {};
        if (status)
            filter.status = status;
        if (dataType)
            filter.dataType = dataType;
        if (user.role === 'OPERATOR') {
            filter.assignedOperators = user.userId;
        }
        const { items, total } = await this.surveysService.findAll(filter, parseInt(page, 10), parseInt(limit, 10));
        return { success: true, data: items, meta: { total, page: parseInt(page, 10), limit: parseInt(limit, 10) } };
    }
    async get(user, id) {
        const survey = await this.surveysService.findById(id);
        if (user.role === 'OPERATOR' && !this.surveysService.isOperatorAssigned(survey, user.userId)) {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'NOT_ASSIGNED', message: 'You are not assigned to this survey.' },
            });
        }
        return { success: true, data: survey };
    }
    async update(user, id, body) {
        if (user.role === 'OPERATOR') {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Only Admins can edit survey configuration.' },
            });
        }
        const survey = await this.surveysService.update(id, body);
        return { success: true, data: survey };
    }
    async remove(user, id) {
        if (user.role === 'OPERATOR') {
            throw new common_1.ForbiddenException({
                success: false,
                error: { code: 'INSUFFICIENT_PERMISSIONS', message: 'Only Admins can delete surveys.' },
            });
        }
        await this.surveysService.delete(id);
        return { success: true, data: { id } };
    }
};
exports.SurveysController = SurveysController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_survey_dto_1.CreateSurveyDto]),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('dataType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "get", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SurveysController.prototype, "remove", null);
exports.SurveysController = SurveysController = __decorate([
    (0, swagger_1.ApiTags)('surveys'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('surveys'),
    __metadata("design:paramtypes", [surveys_service_1.SurveysService,
        realtime_gateway_1.RealtimeGateway])
], SurveysController);
//# sourceMappingURL=surveys.controller.js.map