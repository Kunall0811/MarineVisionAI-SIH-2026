"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FEATURE_NAMES = void 0;
exports.extractFeatures = extractFeatures;
exports.augmentImage = augmentImage;
const sharp_1 = __importDefault(require("sharp"));
exports.FEATURE_NAMES = [
    'meanIntensity',
    'stdIntensity',
    'edgeDensity',
    'topBottomContrast',
    'leftRightContrast',
    'aspectRatio',
    'brightPixelRatio',
    'darkPixelRatio',
];
async function extractFeatures(buffer) {
    const size = 64;
    const { data, info } = await (0, sharp_1.default)(buffer)
        .rotate()
        .grayscale()
        .resize(size, size, { fit: 'fill' })
        .raw()
        .toBuffer({ resolveWithObject: true });
    const width = info.width;
    const height = info.height;
    const pixels = new Float64Array(width * height);
    for (let i = 0; i < pixels.length; i++)
        pixels[i] = data[i];
    const mean = pixels.reduce((a, b) => a + b, 0) / pixels.length;
    const variance = pixels.reduce((a, b) => a + (b - mean) ** 2, 0) / pixels.length;
    const std = Math.sqrt(variance);
    let edgeSum = 0;
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = y * width + x;
            const gx = pixels[idx + 1] - pixels[idx - 1];
            const gy = pixels[idx + width] - pixels[idx - width];
            edgeSum += Math.sqrt(gx * gx + gy * gy);
        }
    }
    const edgeDensity = edgeSum / ((width - 2) * (height - 2) * 255);
    const regionMean = (x1, y1, x2, y2) => {
        let sum = 0;
        let count = 0;
        for (let y = y1; y < y2; y++) {
            for (let x = x1; x < x2; x++) {
                sum += pixels[y * width + x];
                count++;
            }
        }
        return count ? sum / count : 0;
    };
    const topMean = regionMean(0, 0, width, Math.floor(height / 2));
    const bottomMean = regionMean(0, Math.floor(height / 2), width, height);
    const leftMean = regionMean(0, 0, Math.floor(width / 2), height);
    const rightMean = regionMean(Math.floor(width / 2), 0, width, height);
    const brightCount = pixels.reduce((acc, v) => acc + (v > mean + std ? 1 : 0), 0);
    const darkCount = pixels.reduce((acc, v) => acc + (v < mean - std ? 1 : 0), 0);
    const meta = await (0, sharp_1.default)(buffer).metadata();
    const aspectRatio = meta.width && meta.height ? meta.width / meta.height : 1;
    return [
        mean / 255,
        std / 255,
        Math.min(1, edgeDensity),
        (topMean - bottomMean) / 255,
        (leftMean - rightMean) / 255,
        Math.min(3, aspectRatio) / 3,
        brightCount / pixels.length,
        darkCount / pixels.length,
    ];
}
async function augmentImage(buffer, variant) {
    const img = (0, sharp_1.default)(buffer).rotate();
    switch (variant % 4) {
        case 1:
            return img.flop().toBuffer();
        case 2:
            return img.modulate({ brightness: 1.12 }).toBuffer();
        case 3:
            return img.modulate({ brightness: 0.9 }).linear(1.05, 0).toBuffer();
        default:
            return img.blur(0.4).toBuffer();
    }
}
//# sourceMappingURL=feature-extractor.js.map