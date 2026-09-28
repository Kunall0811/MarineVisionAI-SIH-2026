"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiStatusModule = void 0;
const common_1 = require("@nestjs/common");
const ai_inference_module_1 = require("../ai-inference/ai-inference.module");
const detections_module_1 = require("../detections/detections.module");
const ai_training_module_1 = require("../ai-training/ai-training.module");
const storage_module_1 = require("../storage/storage.module");
const ai_status_controller_1 = require("./ai-status.controller");
const model_controller_1 = require("./model.controller");
const notifications_module_1 = require("../notifications/notifications.module");
const sonar_module_1 = require("../sonar/sonar.module");
let AiStatusModule = class AiStatusModule {
};
exports.AiStatusModule = AiStatusModule;
exports.AiStatusModule = AiStatusModule = __decorate([
    (0, common_1.Module)({
        imports: [ai_inference_module_1.AiInferenceModule, detections_module_1.DetectionsModule, ai_training_module_1.AiTrainingModule, storage_module_1.StorageModule, notifications_module_1.NotificationsModule, sonar_module_1.SonarModule],
        controllers: [ai_status_controller_1.AiStatusController, model_controller_1.ModelController],
    })
], AiStatusModule);
//# sourceMappingURL=ai-status.module.js.map