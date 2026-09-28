"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricalModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const historical_controller_1 = require("./historical.controller");
const historical_service_1 = require("./historical.service");
const historical_reference_schema_1 = require("./schemas/historical-reference.schema");
let HistoricalModule = class HistoricalModule {
};
exports.HistoricalModule = HistoricalModule;
exports.HistoricalModule = HistoricalModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: historical_reference_schema_1.HistoricalReference.name, schema: historical_reference_schema_1.HistoricalReferenceSchema }]),
        ],
        controllers: [historical_controller_1.HistoricalController],
        providers: [historical_service_1.HistoricalService],
        exports: [historical_service_1.HistoricalService],
    })
], HistoricalModule);
//# sourceMappingURL=historical.module.js.map