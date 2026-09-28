"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FridayModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const friday_interaction_schema_1 = require("./schemas/friday-interaction.schema");
const intent_parser_service_1 = require("./intent-parser.service");
const command_executor_service_1 = require("./command-executor.service");
const learning_service_1 = require("./learning.service");
const friday_controller_1 = require("./friday.controller");
const surveys_module_1 = require("../surveys/surveys.module");
const detections_module_1 = require("../detections/detections.module");
const sonar_module_1 = require("../sonar/sonar.module");
const reports_module_1 = require("../reports/reports.module");
const mail_module_1 = require("../mail/mail.module");
const audit_module_1 = require("../audit/audit.module");
const elevenlabs_service_1 = require("./elevenlabs.service");
let FridayModule = class FridayModule {
};
exports.FridayModule = FridayModule;
exports.FridayModule = FridayModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([{ name: friday_interaction_schema_1.FridayInteraction.name, schema: friday_interaction_schema_1.FridayInteractionSchema }]),
            bullmq_1.BullModule.registerQueue({ name: 'sonar-processing' }),
            surveys_module_1.SurveysModule,
            detections_module_1.DetectionsModule,
            sonar_module_1.SonarModule,
            reports_module_1.ReportsModule,
            mail_module_1.MailModule,
            audit_module_1.AuditModule,
        ],
        providers: [intent_parser_service_1.IntentParserService, command_executor_service_1.CommandExecutorService, learning_service_1.LearningService, elevenlabs_service_1.ElevenLabsService],
        controllers: [friday_controller_1.FridayController],
    })
], FridayModule);
//# sourceMappingURL=friday.module.js.map