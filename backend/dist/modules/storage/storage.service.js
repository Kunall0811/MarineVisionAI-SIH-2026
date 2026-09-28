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
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
let StorageService = class StorageService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger('StorageService');
        this.driver = this.config.get('storage.driver');
        this.localRoot = path.resolve(this.config.get('storage.localPath'));
        if (this.driver === 'local' && !fs.existsSync(this.localRoot)) {
            fs.mkdirSync(this.localRoot, { recursive: true });
        }
        if (this.driver !== 'local') {
            this.logger.warn(`STORAGE_DRIVER=${this.driver} requested but no S3 client is wired in this build. ` +
                `Falling back to local disk storage - configure a real S3/MinIO client for production.`);
        }
    }
    async putFile(buffer, surveyCode, originalName) {
        const fileHash = crypto.createHash('sha256').update(buffer).digest('hex');
        const ext = path.extname(originalName);
        const safeName = `${fileHash.slice(0, 16)}${ext}`;
        const relativeDir = path.join('surveys', surveyCode);
        const dir = path.join(this.localRoot, relativeDir);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        const relativePath = path.join(relativeDir, safeName);
        const absolutePath = path.join(this.localRoot, relativePath);
        fs.writeFileSync(absolutePath, buffer);
        return { storagePath: relativePath, fileHash };
    }
    getAbsolutePath(storagePath) {
        const candidates = [
            path.join(this.localRoot, storagePath),
            path.join(this.localRoot, 'surveys', storagePath),
            path.join(this.localRoot, 'surveys', 'SURV-HIST-NOAA', path.basename(storagePath)),
            path.resolve(process.cwd(), 'ml/dataset/raw', path.basename(storagePath)),
            path.resolve(process.cwd(), 'datasets/train/images', path.basename(storagePath)),
            path.resolve(process.cwd(), 'datasets/val/images', path.basename(storagePath)),
            path.resolve(process.cwd(), 'datasets/test/images', path.basename(storagePath)),
        ];
        for (const c of candidates) {
            if (fs.existsSync(c)) {
                return c;
            }
        }
        return path.join(this.localRoot, storagePath);
    }
    exists(storagePath) {
        const abs = this.getAbsolutePath(storagePath);
        return fs.existsSync(abs);
    }
    readFile(storagePath) {
        const absPath = this.getAbsolutePath(storagePath);
        if (fs.existsSync(absPath)) {
            return fs.readFileSync(absPath);
        }
        return Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=', 'base64');
    }
};
exports.StorageService = StorageService;
exports.StorageService = StorageService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StorageService);
//# sourceMappingURL=storage.service.js.map