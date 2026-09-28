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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const common_1 = require("@nestjs/common");
const ws_1 = require("ws");
const url_1 = require("url");
const jwt = __importStar(require("jsonwebtoken"));
let RealtimeGateway = class RealtimeGateway {
    constructor() {
        this.logger = new common_1.Logger('RealtimeGateway');
        this.clients = new Map();
    }
    handleConnection(client, request) {
        try {
            const url = new url_1.URL(request.url || '', 'http://localhost');
            const token = url.searchParams.get('token');
            if (!token)
                throw new Error('missing token');
            const secret = process.env.JWT_SECRET || 'dev-only-insecure-secret-change-me';
            const payload = jwt.verify(token, secret);
            this.clients.set(client, { userId: payload.sub, role: payload.role });
            client.send(JSON.stringify({ event: 'connected', data: { ok: true } }));
        }
        catch (err) {
            this.logger.warn('Rejected unauthenticated websocket connection.');
            client.close(4001, 'Unauthorized');
        }
    }
    handleDisconnect(client) {
        this.clients.delete(client);
    }
    emitEvent(event, data, restrictToRole) {
        const payload = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
        for (const [client, meta] of this.clients.entries()) {
            if (restrictToRole && meta.role !== restrictToRole)
                continue;
            if (client.readyState === 1) {
                client.send(payload);
            }
        }
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", typeof (_a = typeof ws_1.Server !== "undefined" && ws_1.Server) === "function" ? _a : Object)
], RealtimeGateway.prototype, "server", void 0);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({ path: '/api/realtime' })
], RealtimeGateway);
//# sourceMappingURL=realtime.gateway.js.map