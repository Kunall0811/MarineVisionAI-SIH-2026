"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonarModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const sonar_frame_schema_1 = require("./schemas/sonar-frame.schema");
const sonar_service_1 = require("./sonar.service");
const sonar_controller_1 = require("./sonar.controller");
const sonar_processing_service_1 = require("./sonar-processing.service");
const sonar_processor_1 = require("./sonar.processor");
const surveys_module_1 = require("../surveys/surveys.module");
const storage_module_1 = require("../storage/storage.module");
const ai_inference_module_1 = require("../ai-inference/ai-inference.module");
const geolocation_module_1 = require("../geolocation/geolocation.module");
const detections_module_1 = require("../detections/detections.module");
const mail_module_1 = require("../mail/mail.module");
let SonarModule = class SonarModule {
};
exports.SonarModule = SonarModule;
exports.SonarModule = SonarModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: sonar_frame_schema_1.SonarFrame.name, schema: sonar_frame_schema_1.SonarFrameSchema }]),
            bullmq_1.BullModule.registerQueue({ name: 'sonar-processing' }),
            surveys_module_1.SurveysModule,
            storage_module_1.StorageModule,
            ai_inference_module_1.AiInferenceModule,
            geolocation_module_1.GeolocationModule,
            detections_module_1.DetectionsModule,
            mail_module_1.MailModule,
        ],
        providers: [sonar_service_1.SonarService, sonar_processing_service_1.SonarProcessingService, sonar_processor_1.SonarQueueProcessor],
        controllers: [sonar_controller_1.SonarController],
        exports: [sonar_service_1.SonarService, mongoose_1.MongooseModule],
    })
], SonarModule);
//# sourceMappingURL=sonar.module.js.map