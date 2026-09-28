"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WaterBodiesModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const water_body_schema_1 = require("./schemas/water-body.schema");
const water_bodies_service_1 = require("./water-bodies.service");
const water_bodies_controller_1 = require("./water-bodies.controller");
let WaterBodiesModule = class WaterBodiesModule {
};
exports.WaterBodiesModule = WaterBodiesModule;
exports.WaterBodiesModule = WaterBodiesModule = __decorate([
    (0, common_1.Module)({
        imports: [mongoose_1.MongooseModule.forFeature([{ name: water_body_schema_1.WaterBody.name, schema: water_body_schema_1.WaterBodySchema }])],
        providers: [water_bodies_service_1.WaterBodiesService],
        controllers: [water_bodies_controller_1.WaterBodiesController],
        exports: [water_bodies_service_1.WaterBodiesService, mongoose_1.MongooseModule],
    })
], WaterBodiesModule);
//# sourceMappingURL=water-bodies.module.js.map