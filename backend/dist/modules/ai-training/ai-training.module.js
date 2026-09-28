"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiTrainingModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const bullmq_1 = require("@nestjs/bullmq");
const dataset_schema_1 = require("./schemas/dataset.schema");
const dataset_image_schema_1 = require("./schemas/dataset-image.schema");
const training_job_schema_1 = require("./schemas/training-job.schema");
const model_version_schema_1 = require("./schemas/model-version.schema");
const datasets_service_1 = require("./datasets.service");
const ai_training_service_1 = require("./ai-training.service");
const model_versions_service_1 = require("./model-versions.service");
const trainer_service_1 = require("./trainer.service");
const training_processor_1 = require("./training.processor");
const ai_training_controller_1 = require("./ai-training.controller");
const storage_module_1 = require("../storage/storage.module");
const audit_module_1 = require("../audit/audit.module");
const detections_module_1 = require("../detections/detections.module");
const notifications_module_1 = require("../notifications/notifications.module");
const surveys_module_1 = require("../surveys/surveys.module");
const mail_module_1 = require("../mail/mail.module");
let AiTrainingModule = class AiTrainingModule {
};
exports.AiTrainingModule = AiTrainingModule;
exports.AiTrainingModule = AiTrainingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: dataset_schema_1.Dataset.name, schema: dataset_schema_1.DatasetSchema },
                { name: dataset_image_schema_1.DatasetImage.name, schema: dataset_image_schema_1.DatasetImageSchema },
                { name: training_job_schema_1.TrainingJob.name, schema: training_job_schema_1.TrainingJobSchema },
                { name: model_version_schema_1.ModelVersion.name, schema: model_version_schema_1.ModelVersionSchema },
            ]),
            bullmq_1.BullModule.registerQueue({ name: 'ai-training' }),
            storage_module_1.StorageModule,
            audit_module_1.AuditModule,
            detections_module_1.DetectionsModule,
            notifications_module_1.NotificationsModule,
            surveys_module_1.SurveysModule,
            mail_module_1.MailModule,
        ],
        providers: [datasets_service_1.DatasetsService, ai_training_service_1.AiTrainingService, model_versions_service_1.ModelVersionsService, trainer_service_1.TrainerService, training_processor_1.AiTrainingProcessor],
        controllers: [ai_training_controller_1.AiTrainingController],
        exports: [datasets_service_1.DatasetsService, ai_training_service_1.AiTrainingService, model_versions_service_1.ModelVersionsService],
    })
], AiTrainingModule);
//# sourceMappingURL=ai-training.module.js.map