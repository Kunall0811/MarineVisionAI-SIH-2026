import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectQueue } from '@nestjs/bullmq';
import { Model } from 'mongoose';
import { Queue } from 'bullmq';
import { TrainingJob, TrainingJobDocument } from './schemas/training-job.schema';

export interface StartTrainingInput {
  datasetId: string;
  epochs: number;
  learningRate: number;
  batchSize: number;
  valSplit: number;
  testSplit: number;
  useAugmentation: boolean;
  createdBy: string;
}

@Injectable()
export class AiTrainingService {
  private processor?: any;

  constructor(
    @InjectModel(TrainingJob.name) private jobModel: Model<TrainingJobDocument>,
    @InjectQueue('ai-training') private trainingQueue: Queue,
  ) {}

  setProcessor(proc: any) {
    this.processor = proc;
  }

  async startJob(input: StartTrainingInput) {
    const job = await this.jobModel.create({
      datasetId: input.datasetId,
      hyperparameters: {
        epochs: input.epochs,
        learningRate: input.learningRate,
        batchSize: input.batchSize,
        valSplit: input.valSplit,
        testSplit: input.testSplit,
        useAugmentation: input.useAugmentation,
        architecture: 'lightweight-softmax-classifier-v1',
      },
      status: 'QUEUED',
      createdBy: input.createdBy,
    });

    try {
      await Promise.race([
        this.trainingQueue.add(
          'run-training',
          { trainingJobId: String(job._id) },
          { removeOnComplete: true, removeOnFail: 50 },
        ),
        new Promise((_, reject) => setTimeout(() => reject(new Error('QUEUE_TIMEOUT')), 1000)),
      ]);
    } catch (queueErr) {
      if (this.processor) {
        setImmediate(() => {
          this.processor?.process({ data: { trainingJobId: String(job._id) } } as any).catch((err: any) => {
            console.error('In-process training execution failed:', err);
          });
        });
      }
    }

    return job;
  }

  findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return Promise.all([
      this.jobModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.jobModel.countDocuments().exec(),
    ]);
  }

  findById(id: string) {
    return this.jobModel.findById(id).exec();
  }

  update(id: string, update: Partial<TrainingJob>) {
    return this.jobModel.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  appendLog(id: string, line: string) {
    return this.jobModel.findByIdAndUpdate(id, { $push: { logLines: `[${new Date().toISOString()}] ${line}` } }).exec();
  }
}
