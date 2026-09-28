import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailLog, EmailLogDocument } from './schemas/email-log.schema';

@Injectable()
export class EmailLogService {
  constructor(@InjectModel(EmailLog.name) private model: Model<EmailLogDocument>) {}

  record(data: Partial<EmailLog>) {
    return this.model.create(data);
  }

  async findAll(page = 1, limit = 30, filter: Record<string, any> = {}) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.model.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.model.countDocuments(filter).exec(),
    ]);
    return { items, total };
  }
}
