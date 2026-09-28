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
exports.WaterBodiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const water_bodies_service_1 = require("./water-bodies.service");
let WaterBodiesController = class WaterBodiesController {
    constructor(service) {
        this.service = service;
    }
    async list(type) {
        const filter = {};
        if (type)
            filter.type = type;
        const items = await this.service.findAll(filter);
        return { success: true, data: items };
    }
    async get(id) {
        const item = await this.service.findById(id);
        return { success: true, data: item };
    }
};
exports.WaterBodiesController = WaterBodiesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WaterBodiesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WaterBodiesController.prototype, "get", null);
exports.WaterBodiesController = WaterBodiesController = __decorate([
    (0, swagger_1.ApiTags)('water-bodies'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('water-bodies'),
    __metadata("design:paramtypes", [water_bodies_service_1.WaterBodiesService])
], WaterBodiesController);
//# sourceMappingURL=water-bodies.controller.js.map