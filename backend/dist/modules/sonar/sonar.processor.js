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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SonarQueueProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const sonar_processing_service_1 = require("./sonar-processing.service");
let SonarQueueProcessor = class SonarQueueProcessor extends bullmq_1.WorkerHost {
    constructor(processingService) {
        super();
        this.processingService = processingService;
        this.logger = new common_1.Logger('SonarQueueProcessor');
    }
    async process(job) {
        this.logger.log(`Processing sonar frame job ${job.id} (frame ${job.data.frameId})`);
        return this.processingService.processFrame(job.data.frameId);
    }
};
exports.SonarQueueProcessor = SonarQueueProcessor;
exports.SonarQueueProcessor = SonarQueueProcessor = __decorate([
    (0, bullmq_1.Processor)('sonar-processing', { concurrency: 4 }),
    __metadata("design:paramtypes", [sonar_processing_service_1.SonarProcessingService])
], SonarQueueProcessor);
//# sourceMappingURL=sonar.processor.js.map