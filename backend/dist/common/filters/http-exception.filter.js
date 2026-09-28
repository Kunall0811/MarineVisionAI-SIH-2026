"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
let HttpExceptionFilter = class HttpExceptionFilter {
    constructor() {
        this.logger = new common_1.Logger('ExceptionFilter');
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let code = 'INTERNAL_SERVER_ERROR';
        let message = 'An unexpected error occurred.';
        if (exception instanceof common_1.HttpException) {
            status = exception.getStatus();
            const body = exception.getResponse();
            if (typeof body === 'object' && body !== null && 'error' in body) {
                const err = body.error;
                code = err.code || code;
                message = err.message || message;
            }
            else if (typeof body === 'object' && body !== null && 'message' in body) {
                const m = body.message;
                message = Array.isArray(m) ? m.join('; ') : m;
                code = this.codeFromStatus(status);
            }
            else {
                message = String(body);
                code = this.codeFromStatus(status);
            }
        }
        else if (exception instanceof Error) {
            this.logger.error(exception.message, exception.stack);
        }
        response.status(status).json({
            success: false,
            error: { code, message },
            path: request.url,
            timestamp: new Date().toISOString(),
        });
    }
    codeFromStatus(status) {
        switch (status) {
            case common_1.HttpStatus.UNAUTHORIZED:
                return 'UNAUTHORIZED';
            case common_1.HttpStatus.FORBIDDEN:
                return 'FORBIDDEN';
            case common_1.HttpStatus.NOT_FOUND:
                return 'NOT_FOUND';
            case common_1.HttpStatus.BAD_REQUEST:
                return 'BAD_REQUEST';
            case common_1.HttpStatus.CONFLICT:
                return 'CONFLICT';
            default:
                return 'INTERNAL_SERVER_ERROR';
        }
    }
};
exports.HttpExceptionFilter = HttpExceptionFilter;
exports.HttpExceptionFilter = HttpExceptionFilter = __decorate([
    (0, common_1.Catch)()
], HttpExceptionFilter);
//# sourceMappingURL=http-exception.filter.js.map