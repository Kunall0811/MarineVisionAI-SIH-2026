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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LearningService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const friday_interaction_schema_1 = require("./schemas/friday-interaction.schema");
let LearningService = class LearningService {
    constructor(model) {
        this.model = model;
    }
    async logInteraction(data) {
        return this.model.create(data);
    }
    async updateInteraction(id, update) {
        return this.model.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    async findById(id) {
        return this.model.findById(id).exec();
    }
    async history(userId, limit = 30) {
        return this.model.find({ userId }).sort({ createdAt: -1 }).limit(limit).exec();
    }
    async frequentCommands(userId, limit = 5) {
        return this.model.aggregate([
            { $match: { userId: new mongoose_2.Types.ObjectId(userId), status: 'EXECUTED' } },
            { $group: { _id: '$intent', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: limit },
        ]);
    }
    async frequentlyViewedClasses(userId, limit = 5) {
        const rows = await this.model
            .find({
            userId,
            intent: { $in: ['SHOW_ANOMALIES', 'OPEN_ANOMALY'] },
            status: 'EXECUTED',
        })
            .select('parameters')
            .lean()
            .exec();
        const counts = new Map();
        for (const row of rows) {
            const cls = row.parameters?.class || row.parameters?.filter?.class;
            if (cls)
                counts.set(cls, (counts.get(cls) || 0) + 1);
        }
        return [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([klass, count]) => ({ class: klass, count }));
    }
    async proactiveSuggestion(userId, justExecutedIntent) {
        const MIN_OCCURRENCES = 2;
        const history = await this.model.find({ userId, status: 'EXECUTED' }).sort({ createdAt: 1 }).select('intent parameters').lean().exec();
        if (history.length < 3)
            return null;
        const transitions = new Map();
        for (let i = 0; i < history.length - 1; i++) {
            const from = history[i].intent;
            const to = history[i + 1].intent;
            if (!transitions.has(from))
                transitions.set(from, new Map());
            const inner = transitions.get(from);
            inner.set(to, (inner.get(to) || 0) + 1);
        }
        const candidates = transitions.get(justExecutedIntent);
        if (!candidates)
            return null;
        const total = [...candidates.values()].reduce((a, b) => a + b, 0);
        const [bestIntent, bestCount] = [...candidates.entries()].sort((a, b) => b[1] - a[1])[0];
        if (bestCount < MIN_OCCURRENCES || bestCount / total <= 0.5)
            return null;
        const readable = {
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
};
exports.LearningService = LearningService;
exports.LearningService = LearningService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(friday_interaction_schema_1.FridayInteraction.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], LearningService);
//# sourceMappingURL=learning.service.js.map