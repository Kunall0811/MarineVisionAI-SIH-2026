"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GlobeModule = void 0;
const common_1 = require("@nestjs/common");
const globe_controller_1 = require("./globe.controller");
const surveys_module_1 = require("../surveys/surveys.module");
const detections_module_1 = require("../detections/detections.module");
const water_bodies_module_1 = require("../water-bodies/water-bodies.module");
const historical_module_1 = require("../historical/historical.module");
let GlobeModule = class GlobeModule {
};
exports.GlobeModule = GlobeModule;
exports.GlobeModule = GlobeModule = __decorate([
    (0, common_1.Module)({
        imports: [surveys_module_1.SurveysModule, detections_module_1.DetectionsModule, water_bodies_module_1.WaterBodiesModule, historical_module_1.HistoricalModule],
        controllers: [globe_controller_1.GlobeController],
    })
], GlobeModule);
//# sourceMappingURL=globe.module.js.map