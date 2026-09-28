import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { SonarProcessingService } from './sonar-processing.service';

export interface SonarProcessingJobData {
  frameId: string;
}

/**
 * BullMQ worker - processes sonar frames off the HTTP request thread so
 * that uploading/processing 1,000+ images never blocks the API (spec
 * section 14/46). Concurrency is tunable via the Processor decorator.
 */
@Processor('sonar-processing', { concurrency: 4 })
export class SonarQueueProcessor extends WorkerHost {
  private readonly logger = new Logger('SonarQueueProcessor');

  constructor(private processingService: SonarProcessingService) {
    super();
  }

  async process(job: Job<SonarProcessingJobData>): Promise<any> {
    this.logger.log(`Processing sonar frame job ${job.id} (frame ${job.data.frameId})`);
    return this.processingService.processFrame(job.data.frameId);
  }
}
