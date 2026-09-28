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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ElevenLabsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ElevenLabsService = class ElevenLabsService {
    constructor(config) {
        this.config = config;
    }
    get apiKey() {
        return this.config.get('elevenlabs.apiKey') || '';
    }
    isConfigured() {
        return Boolean(this.apiKey);
    }
    async transcribe(audio, mimeType = 'audio/webm') {
        if (!this.apiKey) {
            throw new common_1.ServiceUnavailableException({
                success: false,
                error: {
                    code: 'ELEVENLABS_NOT_CONFIGURED',
                    message: 'ElevenLabs is not configured. Set ELEVENLABS_API_KEY on the backend.',
                },
            });
        }
        const form = new FormData();
        form.append('model_id', this.config.get('elevenlabs.sttModel') || 'scribe_v2');
        form.append('file', new Blob([new Uint8Array(audio)], { type: mimeType }), 'friday-audio.webm');
        const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: { 'xi-api-key': this.apiKey },
            body: form,
        });
        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            throw new common_1.ServiceUnavailableException({
                success: false,
                error: {
                    code: 'ELEVENLABS_STT_FAILED',
                    message: `ElevenLabs speech recognition failed (${response.status}).`,
                    detail: detail.slice(0, 500),
                },
            });
        }
        const data = await response.json();
        return {
            text: String(data.text || '').trim(),
            languageCode: data.language_code || null,
            languageProbability: data.language_probability ?? null,
        };
    }
    async synthesize(text) {
        if (!this.apiKey) {
            throw new common_1.ServiceUnavailableException({
                success: false,
                error: {
                    code: 'ELEVENLABS_NOT_CONFIGURED',
                    message: 'ElevenLabs is not configured. Set ELEVENLABS_API_KEY on the backend.',
                },
            });
        }
        const voiceId = this.config.get('elevenlabs.voiceId') || '21m00Tcm4TlvDq8ikWAM';
        const modelId = this.config.get('elevenlabs.ttsModel') || 'eleven_multilingual_v2';
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=mp3_44100_128`, {
            method: 'POST',
            headers: {
                'xi-api-key': this.apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                text: text.slice(0, 5000),
                model_id: modelId,
                voice_settings: {
                    stability: 0.62,
                    similarity_boost: 0.82,
                    style: 0.18,
                    use_speaker_boost: true,
                },
            }),
        });
        if (!response.ok) {
            const detail = await response.text().catch(() => '');
            throw new common_1.ServiceUnavailableException({
                success: false,
                error: {
                    code: 'ELEVENLABS_TTS_FAILED',
                    message: `ElevenLabs voice synthesis failed (${response.status}).`,
                    detail: detail.slice(0, 500),
                },
            });
        }
        return Buffer.from(await response.arrayBuffer());
    }
};
exports.ElevenLabsService = ElevenLabsService;
exports.ElevenLabsService = ElevenLabsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ElevenLabsService);
//# sourceMappingURL=elevenlabs.service.js.map