"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const water_body_schema_1 = require("../modules/water-bodies/schemas/water-body.schema");
const SOURCE_LABEL = 'SIMULATED DEMO DATA - simplified illustrative boundary (not survey-grade hydrography)';
const WATER_BODIES = [
    {
        name: 'Arabian Sea',
        type: 'SEA',
        region: 'Indian Ocean, India/Pakistan/Oman coast',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [50, 10],
                    [50, 25],
                    [77, 25],
                    [77, 6],
                    [50, 10],
                ],
            ],
        },
    },
    {
        name: 'Bay of Bengal',
        type: 'SEA',
        region: 'Indian Ocean, India/Bangladesh/Myanmar coast',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [78, 6],
                    [78, 22],
                    [95, 22],
                    [95, 6],
                    [78, 6],
                ],
            ],
        },
    },
    {
        name: 'Indian Ocean',
        type: 'OCEAN',
        region: 'Global',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [20, -60],
                    [20, 30],
                    [120, 30],
                    [120, -60],
                    [20, -60],
                ],
            ],
        },
    },
    {
        name: 'Pacific Ocean',
        type: 'OCEAN',
        region: 'Global',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [120, -60],
                    [120, 60],
                    [-70, 60],
                    [-70, -60],
                    [120, -60],
                ],
            ],
        },
    },
    {
        name: 'Atlantic Ocean',
        type: 'OCEAN',
        region: 'Global',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [-70, -60],
                    [-70, 60],
                    [20, 60],
                    [20, -60],
                    [-70, -60],
                ],
            ],
        },
    },
    {
        name: 'Mediterranean Sea',
        type: 'SEA',
        region: 'Southern Europe / North Africa',
        geometry: {
            type: 'Polygon',
            coordinates: [
                [
                    [-6, 30],
                    [-6, 45],
                    [36, 45],
                    [36, 30],
                    [-6, 30],
                ],
            ],
        },
    },
];
async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/marinevision';
    await mongoose_1.default.connect(uri);
    const WaterBodyModel = mongoose_1.default.model(water_body_schema_1.WaterBody.name, water_body_schema_1.WaterBodySchema);
    for (const wb of WATER_BODIES) {
        await WaterBodyModel.findOneAndUpdate({ name: wb.name }, { ...wb, source: SOURCE_LABEL }, { upsert: true, new: true });
        console.log(`Seeded water body: ${wb.name}`);
    }
    await mongoose_1.default.disconnect();
    console.log('Water body seeding complete.');
}
run().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-water-bodies.js.map