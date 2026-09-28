import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FridayInteraction, FridayInteractionDocument } from './schemas/friday-interaction.schema';

export interface Suggestion {
  text: string;
  basedOn: string; // explains the real signal behind the suggestion - never invented
  suggestedIntent: string;
  suggestedParameters: Record<string, any>;
}

/**
 * FRIDAY's self-learning / personalization layer. Every number here is
 * computed from this user's own logged FridayInteraction history - no
 * behaviour or preference is invented. Per the spec: predictions are based
 * only on available historical data, and FRIDAY never claims to "predict
 * everything".
 */
@Injectable()
export class LearningService {
  constructor(@InjectModel(FridayInteraction.name) private model: Model<FridayInteractionDocument>) {}

  async logInteraction(data: Partial<FridayInteraction>) {
    return this.model.create(data);
  }

  async updateInteraction(id: string, update: Partial<FridayInteraction>) {
    return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
  }

  async findById(id: string) {
    return this.model.findById(id).exec();
  }

  async history(userId: string, limit = 30) {
    return this.model.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
  }

  /** Real frequency counts of this user's commands, most-used first. */
  async frequentCommands(userId: string, limit = 5) {
    return this.model.aggregate([
      { $match: { userId: new Types.ObjectId(userId), status: 'EXECUTED' } },
      { $group: { _id: '$intent', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
  }

  /** Real frequency counts of anomaly classes this user has looked at via SHOW_ANOMALIES / OPEN_ANOMALY. */
  async frequentlyViewedClasses(userId: string, limit = 5) {
    const rows = await this.model
      .find({
        userId,
        intent: { $in: ['SHOW_ANOMALIES', 'OPEN_ANOMALY'] },
        status: 'EXECUTED',
      })
      .select('parameters')
      .lean()
      .exec();

    const counts = new Map<string, number>();
    for (const row of rows) {
      const cls = (row.parameters as any)?.class || (row.parameters as any)?.filter?.class;
      if (cls) counts.set(cls, (counts.get(cls) || 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([klass, count]) => ({ class: klass, count }));
  }

  /**
   * Computes real intent -> next-intent transition counts from this user's
   * chronological history, then, given the current intent, proposes the
   * single most common next action IF it occurred at least MIN_OCCURRENCES
   * times and represents more than 50% of what follows this intent. This
   * is a plain co-occurrence statistic, not a trained model - it is
   * intentionally conservative so FRIDAY doesn't manufacture confidence it
   * doesn't have.
   */
  async proactiveSuggestion(userId: string, justExecutedIntent: string): Promise<Suggestion | null> {
    const MIN_OCCURRENCES = 2;
    const history = await this.model.find({ userId, status: 'EXECUTED' }).sort({ createdAt: 1 }).select('intent parameters').lean().exec();
    if (history.length < 3) return null;

    const transitions = new Map<string, Map<string, number>>();
    for (let i = 0; i < history.length - 1; i++) {
      const from = history[i].intent;
      const to = history[i + 1].intent;
      if (!transitions.has(from)) transitions.set(from, new Map());
      const inner = transitions.get(from)!;
      inner.set(to, (inner.get(to) || 0) + 1);
    }

    const candidates = transitions.get(justExecutedIntent);
    if (!candidates) return null;

    const total = [...candidates.values()].reduce((a, b) => a + b, 0);
    const [bestIntent, bestCount] = [...candidates.entries()].sort((a, b) => b[1] - a[1])[0];

    if (bestCount < MIN_OCCURRENCES || bestCount / total <= 0.5) return null;

    const readable: Record<string, string> = {
      SHOW_ANOMALIES: 'review the anomaly queue',
      GENERATE_REPORT: 'generate a report',
      SEND_REPORT: 'send the report to the authority',
      VERIFY_ANOMALY: 'verify the flagged anomaly',
      OPEN_ANOMALY: 'open the latest anomaly',
    };

    const text = readable[bestIntent]
      ? `You usually ${readable[bestIntent]} after this. Want me to do that now?`
      : `You usually run "${bestIntent}" next. Want me to do that now?`;

    return {
      text,
      basedOn: `Based on ${bestCount} of your last ${total} "${justExecutedIntent}" -> "${bestIntent}" transitions in your own command history.`,
      suggestedIntent: bestIntent,
      suggestedParameters: {},
    };
  }
}
