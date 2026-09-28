import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EmailRecipient, EmailRecipientDocument } from './schemas/email-recipient.schema';

@Injectable()
export class EmailRecipientsService {
  constructor(@InjectModel(EmailRecipient.name) private model: Model<EmailRecipientDocument>) {}

  create(data: Partial<EmailRecipient>) {
    return this.model.create(data);
  }

  findAll(activeOnly = false) {
    const filter = activeOnly ? { isActive: true } : {};
    return this.model.find(filter).sort({ createdAt: -1 }).exec();
  }

  findByEvent(event: string) {
    return this.model.find({ isActive: true, subscribedEvents: event }).exec();
  }

  update(id: string, update: Partial<EmailRecipient>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  delete(id: string) {
    return this.model.findByIdAndDelete(id).exec();
  }
}
