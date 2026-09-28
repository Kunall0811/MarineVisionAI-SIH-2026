import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Survey, SurveyDocument } from './schemas/survey.schema';

@Injectable()
export class SurveysService {
  constructor(@InjectModel(Survey.name) private surveyModel: Model<SurveyDocument>) {}

  create(data: Partial<Survey>) {
    return this.surveyModel.create(data);
  }

  async findAll(filter: Record<string, any> = {}, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.surveyModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.surveyModel.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }

  async findById(id: string) {
    let survey: any = null;
    if (Types.ObjectId.isValid(id)) {
      survey = await this.surveyModel.findById(id).exec();
    }
    if (!survey) {
      survey = await this.surveyModel.findOne({ code: id }).exec();
    }
    if (!survey) {
      throw new NotFoundException({
        success: false,
        error: { code: 'SURVEY_NOT_FOUND', message: 'Survey not found.' },
      });
    }
    return survey;
  }

  async findByCode(code: string) {
    return this.surveyModel.findOne({ code }).exec();
  }

  async update(id: string, update: Partial<Survey>) {
    if (Types.ObjectId.isValid(id)) {
      return this.surveyModel.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    return this.surveyModel.findOneAndUpdate({ code: id }, update, { new: true }).exec();
  }

  async incrementFrameCounts(id: string, fields: { totalFrames?: number; processedFrames?: number; failedFrames?: number }) {
    const inc: Record<string, number> = {};
    if (fields.totalFrames) inc.totalFrames = fields.totalFrames;
    if (fields.processedFrames) inc.processedFrames = fields.processedFrames;
    if (fields.failedFrames) inc.failedFrames = fields.failedFrames;
    if (Types.ObjectId.isValid(id)) {
      return this.surveyModel.findByIdAndUpdate(id, { $inc: inc }, { new: true }).exec();
    }
    return this.surveyModel.findOneAndUpdate({ code: id }, { $inc: inc }, { new: true }).exec();
  }

  async appendRoutePoint(id: string, longitude: number, latitude: number) {
    return this.surveyModel
      .findByIdAndUpdate(id, { $push: { 'route.coordinates': [longitude, latitude] } }, { new: true })
      .exec();
  }

  delete(id: string) {
    return this.surveyModel.findByIdAndDelete(id).exec();
  }

  isOperatorAssigned(survey: SurveyDocument, operatorId: string) {
    return survey.assignedOperators.some((id) => String(id) === operatorId);
  }
}
