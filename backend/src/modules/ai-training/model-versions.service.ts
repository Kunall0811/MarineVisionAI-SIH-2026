import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ModelVersion, ModelVersionDocument } from './schemas/model-version.schema';

// A metrics snapshot only counts as "real evaluation" if it has actual
// numeric values for these keys - null/undefined means evaluation did not
// run (see ml/scripts/evaluate.py, which writes null rather than a fake
// number when it can't evaluate).
function hasRealMetrics(metrics: Record<string, any> | undefined | null): boolean {
  if (!metrics) return false;
  const candidates = [
    metrics.precisionMacro,
    metrics.recallMacro,
    metrics.f1Macro,
    metrics.accuracy,
    metrics.mAP50,
    metrics.map50, // tolerate the ml/ Python pipeline's evaluation.json naming too
  ];
  return candidates.some((v) => typeof v === 'number' && !Number.isNaN(v));
}

@Injectable()
export class ModelVersionsService {
  constructor(@InjectModel(ModelVersion.name) private model: Model<ModelVersionDocument>) {}

  create(data: Partial<ModelVersion>) {
    // Auto-derive the initial quality gate state from whether real
    // evaluation metrics are present - never trust a caller-supplied
    // qualityState of VALIDATED/ACTIVE without evidence.
    const qualityState = hasRealMetrics(data.metricsSnapshot) ? 'VALIDATED' : 'EXPERIMENTAL';
    return this.model.create({ ...data, qualityState, isActive: false });
  }

  findAll() {
    return this.model.find().sort({ createdAt: -1 }).exec();
  }

  async findById(id: string) {
    const version = await this.model.findById(id).exec();
    if (!version) {
      throw new NotFoundException({ success: false, error: { code: 'MODEL_VERSION_NOT_FOUND', message: 'Model version not found.' } });
    }
    return version;
  }

  /** Admin marks a VALIDATED model as ready to be considered for activation. */
  async promoteToCandidate(id: string) {
    const version = await this.findById(id);
    if (version.qualityState !== 'VALIDATED') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'MODEL_NOT_VALIDATED',
          message: `Model is ${version.qualityState}, not VALIDATED. It needs real test-split evaluation metrics before it can become a production candidate.`,
        },
      });
    }
    return this.model.findByIdAndUpdate(id, { qualityState: 'PRODUCTION_CANDIDATE' }, { new: true }).exec();
  }

  async activate(id: string) {
    const version = await this.findById(id);
    if (version.qualityState !== 'PRODUCTION_CANDIDATE' && version.qualityState !== 'VALIDATED') {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'MODEL_NOT_READY',
          message: `Model is ${version.qualityState}. Only VALIDATED or PRODUCTION_CANDIDATE models (real test-split metrics on file) can be activated. Experimental/smoke-test models cannot serve production inference.`,
        },
      });
    }
    await this.model.updateMany({ isActive: true }, { isActive: false, qualityState: 'VALIDATED' }).exec();
    return this.model.findByIdAndUpdate(id, { isActive: true, qualityState: 'ACTIVE' }, { new: true }).exec();
  }

  active() {
    return this.model.findOne({ isActive: true }).exec();
  }
}
