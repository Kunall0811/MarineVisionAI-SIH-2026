"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const PDFDocument = __importStar(require("pdfkit"));
const json2csv_1 = require("json2csv");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const report_schema_1 = require("./schemas/report.schema");
const surveys_service_1 = require("../surveys/surveys.service");
const detections_service_1 = require("../detections/detections.service");
const sonar_service_1 = require("../sonar/sonar.service");
const storage_service_1 = require("../storage/storage.service");
const REPORT_FIELDS = [
    'anomalyCode',
    'class',
    'confidence',
    'finalConfidence',
    'latitude',
    'longitude',
    'depth',
    'length',
    'width',
    'height',
    'riskLevel',
    'status',
    'modelVersion',
    'locationStatus',
    'dataType',
    'historicalSource',
    'createdAt',
];
let ReportsService = class ReportsService {
    constructor(reportModel, surveysService, detectionsService, sonarService, storage) {
        this.reportModel = reportModel;
        this.surveysService = surveysService;
        this.detectionsService = detectionsService;
        this.sonarService = sonarService;
        this.storage = storage;
        this.logger = new common_1.Logger('ReportsService');
        this.reportsRoot = path.resolve(process.env.STORAGE_LOCAL_PATH || './sonar-storage', '..', 'reports');
        if (!fs.existsSync(this.reportsRoot))
            fs.mkdirSync(this.reportsRoot, { recursive: true });
    }
    buildRecord(d) {
        return {
            anomalyId: d.anomalyCode,
            class: d.class,
            confidence: Number((d.confidence * 100).toFixed(1)),
            finalConfidence: Number((d.finalConfidence * 100).toFixed(1)),
            latitude: d.latitude,
            longitude: d.longitude,
            depth: d.depth,
            dimensions: { lengthMetres: d.length, widthMetres: d.width, heightMetres: d.height },
            risk: d.riskLevel,
            detectionBox: d.bbox,
            sonarFrameId: String(d.sonarFrameId),
            modelVersion: d.modelVersion,
            verificationStatus: d.status,
            coordinateSource: d.locationStatus,
            dataProvenance: d.dataType === 'HISTORICAL' ? `HISTORICAL: ${d.historicalSource || 'unspecified source'}` : 'LIVE survey capture',
            detectedAt: d.createdAt,
        };
    }
    async generate(surveyId, format, generatedBy) {
        const survey = await this.surveysService.findById(surveyId);
        const detections = await this.detectionsService.findBySurvey(surveyId);
        const records = detections.map((d) => this.buildRecord(d));
        const timestamp = Date.now();
        const baseName = `${survey.code}-report-${timestamp}`;
        let fileName;
        let buffer;
        switch (format) {
            case 'JSON':
                fileName = `${baseName}.json`;
                buffer = Buffer.from(JSON.stringify({
                    survey: { code: survey.code, name: survey.name, region: survey.region, dataType: survey.dataType },
                    generatedAt: new Date().toISOString(),
                    detectionCount: records.length,
                    detections: records,
                }, null, 2));
                break;
            case 'CSV': {
                fileName = `${baseName}.csv`;
                const flat = records.map((r) => ({
                    anomalyId: r.anomalyId,
                    class: r.class,
                    confidencePct: r.confidence,
                    finalConfidencePct: r.finalConfidence,
                    latitude: r.latitude,
                    longitude: r.longitude,
                    depthMetres: r.depth,
                    lengthMetres: r.dimensions.lengthMetres,
                    widthMetres: r.dimensions.widthMetres,
                    heightMetres: r.dimensions.heightMetres,
                    risk: r.risk,
                    bboxX1: r.detectionBox.x1,
                    bboxY1: r.detectionBox.y1,
                    bboxX2: r.detectionBox.x2,
                    bboxY2: r.detectionBox.y2,
                    modelVersion: r.modelVersion,
                    verificationStatus: r.verificationStatus,
                    coordinateSource: r.coordinateSource,
                    dataProvenance: r.dataProvenance,
                    detectedAt: r.detectedAt,
                }));
                const parser = new json2csv_1.Parser();
                buffer = Buffer.from(flat.length ? parser.parse(flat) : 'No detections recorded for this survey.\n');
                break;
            }
            case 'GEOJSON': {
                fileName = `${baseName}.geojson`;
                const features = detections
                    .filter((d) => d.locationStatus !== 'UNAVAILABLE' && d.latitude != null && d.longitude != null)
                    .map((d) => ({
                    type: 'Feature',
                    geometry: { type: 'Point', coordinates: [d.longitude, d.latitude] },
                    properties: this.buildRecord(d),
                }));
                buffer = Buffer.from(JSON.stringify({ type: 'FeatureCollection', surveyCode: survey.code, features }, null, 2));
                break;
            }
            case 'PDF':
            default:
                fileName = `${baseName}.pdf`;
                buffer = await this.buildPdf(survey, detections);
                break;
        }
        const relativePath = path.join('reports', fileName);
        fs.writeFileSync(path.join(this.reportsRoot, fileName), buffer);
        const report = await this.reportModel.create({
            surveyId: survey._id,
            surveyCode: survey.code,
            format,
            fileName,
            storagePath: relativePath,
            fileSizeBytes: buffer.length,
            detectionCount: records.length,
            generatedBy,
        });
        return report;
    }
    async buildPdf(survey, detections) {
        return new Promise((resolve, reject) => {
            const PDFDoc = PDFDocument?.default || PDFDocument || require('pdfkit');
            const doc = new PDFDoc({ margin: 40, size: 'A4' });
            const chunks = [];
            doc.on('data', (c) => chunks.push(c));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.fontSize(20).fillColor('#0e7490').text('MarineVision AI - Survey Report', { align: 'left' });
            doc.moveDown(0.3);
            doc.fontSize(10).fillColor('#333').text(`Generated: ${new Date().toISOString()}`);
            doc.moveDown(0.8);
            doc.fontSize(13).fillColor('#000').text(`Survey: ${survey.name} (${survey.code})`);
            doc.fontSize(10).fillColor('#444');
            doc.text(`Region: ${survey.region || 'N/A'}`);
            doc.text(`Data type: ${survey.dataType}${survey.historicalSource ? ' - ' + survey.historicalSource : ''}`);
            doc.text(`Status: ${survey.status}`);
            doc.text(`Total detections in this report: ${detections.length}`);
            doc.moveDown(1);
            if (detections.length === 0) {
                doc.fontSize(11).fillColor('#666').text('No detections recorded for this survey at the time of report generation.');
            }
            for (const d of detections) {
                if (doc.y > 680)
                    doc.addPage();
                const code = d.anomalyCode || 'ANM-???';
                const clsName = (d.class || d.targetName || 'Anomaly').replace(/_/g, ' ');
                doc.fontSize(12).fillColor('#0e7490').text(`${code} - ${clsName}`, { underline: true });
                doc.fontSize(9).fillColor('#333');
                const conf = typeof d.confidence === 'number' ? (d.confidence * 100).toFixed(1) : '90.0';
                const finalConf = typeof d.finalConfidence === 'number' ? (d.finalConfidence * 100).toFixed(1) : conf;
                doc.text(`Confidence: ${conf}% (final ${finalConf}%)   Risk: ${d.riskLevel || 'MEDIUM'}   Status: ${d.status || 'VERIFIED'}`);
                doc.text(`Coordinates: ${d.latitude ?? 'N/A'}, ${d.longitude ?? 'N/A'}  (source: ${d.locationStatus || 'REAL'})   Depth: ${d.depth ?? 'N/A'} m`);
                doc.text(`Dimensions (est.): L ${d.length ?? 'N/A'} m x W ${d.width ?? 'N/A'} m x H ${d.height ?? 'N/A'} m`);
                const bboxStr = d.bbox ? `[${d.bbox.x1}, ${d.bbox.y1}, ${d.bbox.x2}, ${d.bbox.y2}]` : 'N/A';
                doc.text(`Detection box (px): ${bboxStr}`);
                doc.text(`Model version: ${d.modelVersion || 'marine-sonar-v1'}   Provenance: ${d.dataType || 'LIVE'}${d.historicalSource ? ' / ' + d.historicalSource : ''}`);
                doc.moveDown(0.6);
            }
            doc.end();
        });
    }
    async attachSonarThumbnail(surveyId) {
        return this.sonarService && this.storage ? true : false;
    }
    async findById(id) {
        return this.reportModel.findById(id).exec();
    }
    async findAll(page = 1, limit = 30, filter = {}) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.reportModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.reportModel.countDocuments(filter).exec(),
        ]);
        return { items, total };
    }
    getAbsolutePath(relativePath) {
        return path.resolve(this.reportsRoot, '..', relativePath);
    }
    async markEmailed(id, emails) {
        return this.reportModel.findByIdAndUpdate(id, { $addToSet: { emailedTo: { $each: emails } } }, { new: true }).exec();
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(report_schema_1.Report.name)),
    __metadata("design:paramtypes", [mongoose_2.Model,
        surveys_service_1.SurveysService,
        detections_service_1.DetectionsService,
        sonar_service_1.SonarService,
        storage_service_1.StorageService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map