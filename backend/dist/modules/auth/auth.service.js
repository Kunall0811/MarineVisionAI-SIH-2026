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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const crypto = __importStar(require("crypto"));
const users_service_1 = require("../users/users.service");
const mail_service_1 = require("../mail/mail.service");
const HASH_ROUNDS = 12;
function hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
}
let AuthService = class AuthService {
    constructor(usersService, jwtService, config, mailService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.config = config;
        this.mailService = mailService;
    }
    async register(dto) {
        const existing = await this.usersService.findByEmail(dto.email);
        if (existing) {
            throw new common_1.ConflictException({
                success: false,
                error: { code: 'EMAIL_ALREADY_REGISTERED', message: 'An account with this email already exists.' },
            });
        }
        const passwordHash = await bcrypt.hash(dto.password, HASH_ROUNDS);
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const user = await this.usersService.create({
            fullName: dto.fullName,
            email: dto.email.toLowerCase().trim(),
            passwordHash,
            role: 'OPERATOR',
            isEmailVerified: false,
            emailVerificationTokenHash: hashToken(verificationToken),
            emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
        const verifyUrl = `${this.config.get('appPublicUrl')}/verify-email?token=${verificationToken}&email=${encodeURIComponent(user.email)}`;
        const emailResult = await this.mailService.sendVerificationEmail(user.email, user.fullName, verifyUrl);
        return {
            id: user._id,
            email: user.email,
            fullName: user.fullName,
            role: user.role,
            emailDelivery: emailResult.status,
        };
    }
    async verifyEmail(email, token) {
        const user = await this.usersService.findByEmail(email, true);
        if (!user || !user.emailVerificationTokenHash || !user.emailVerificationExpires) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'INVALID_VERIFICATION', message: 'Invalid or expired verification link.' },
            });
        }
        if (user.emailVerificationExpires.getTime() < Date.now()) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'VERIFICATION_EXPIRED', message: 'Verification link expired. Please request a new one.' },
            });
        }
        if (hashToken(token) !== user.emailVerificationTokenHash) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'INVALID_VERIFICATION', message: 'Invalid verification token.' },
            });
        }
        await this.usersService.updateById(String(user._id), {
            isEmailVerified: true,
            emailVerificationTokenHash: null,
            emailVerificationExpires: null,
        });
        return { verified: true };
    }
    async validateCredentials(email, password) {
        const user = await this.usersService.findByEmail(email, true);
        if (!user)
            return null;
        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid)
            return null;
        return user;
    }
    async login(email, password) {
        const user = await this.validateCredentials(email, password);
        if (!user) {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'INVALID_CREDENTIALS', message: 'Incorrect email or password.' },
            });
        }
        if (!user.isActive) {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'ACCOUNT_DISABLED', message: 'This account has been disabled by an administrator.' },
            });
        }
        if (!user.isEmailVerified) {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before logging in.' },
            });
        }
        const tokens = await this.issueTokens(String(user._id), user.email, user.role);
        await this.usersService.updateById(String(user._id), {
            lastLoginAt: new Date(),
            refreshTokenHash: hashToken(tokens.refreshToken),
        });
        return {
            ...tokens,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                operatorPermissions: user.operatorPermissions,
            },
        };
    }
    async issueTokens(userId, email, role) {
        const payload = { sub: userId, email, role };
        const accessToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get('jwt.secret'),
            expiresIn: this.config.get('jwt.expiresIn'),
        });
        const refreshToken = await this.jwtService.signAsync(payload, {
            secret: this.config.get('jwt.refreshSecret'),
            expiresIn: this.config.get('jwt.refreshExpiresIn'),
        });
        return { accessToken, refreshToken };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = await this.jwtService.verifyAsync(refreshToken, {
                secret: this.config.get('jwt.refreshSecret'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token is invalid or expired.' },
            });
        }
        const user = await this.usersService.findByEmail(payload.email, true);
        if (!user || user.refreshTokenHash !== hashToken(refreshToken)) {
            throw new common_1.UnauthorizedException({
                success: false,
                error: { code: 'INVALID_REFRESH_TOKEN', message: 'Refresh token does not match any active session.' },
            });
        }
        const tokens = await this.issueTokens(String(user._id), user.email, user.role);
        await this.usersService.updateById(String(user._id), {
            refreshTokenHash: hashToken(tokens.refreshToken),
        });
        return tokens;
    }
    async logout(userId) {
        await this.usersService.updateById(userId, { refreshTokenHash: null });
        return { loggedOut: true };
    }
    async forgotPassword(email) {
        const user = await this.usersService.findByEmail(email);
        if (!user)
            return { requested: true };
        const resetToken = crypto.randomBytes(32).toString('hex');
        await this.usersService.updateById(String(user._id), {
            passwordResetTokenHash: hashToken(resetToken),
            passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
        });
        const resetUrl = `${this.config.get('appPublicUrl')}/reset-password?token=${resetToken}&email=${encodeURIComponent(user.email)}`;
        await this.mailService.sendPasswordResetEmail(user.email, user.fullName, resetUrl);
        return { requested: true };
    }
    async resetPassword(email, token, newPassword) {
        const user = await this.usersService.findByEmail(email, true);
        if (!user ||
            !user.passwordResetTokenHash ||
            !user.passwordResetExpires ||
            user.passwordResetExpires.getTime() < Date.now() ||
            hashToken(token) !== user.passwordResetTokenHash) {
            throw new common_1.BadRequestException({
                success: false,
                error: { code: 'INVALID_RESET_TOKEN', message: 'Invalid or expired password reset link.' },
            });
        }
        const passwordHash = await bcrypt.hash(newPassword, HASH_ROUNDS);
        await this.usersService.updateById(String(user._id), {
            passwordHash,
            passwordResetTokenHash: null,
            passwordResetExpires: null,
            refreshTokenHash: null,
        });
        return { reset: true };
    }
    async me(userId) {
        const user = await this.usersService.findById(userId);
        if (!user)
            throw new common_1.NotFoundException({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
        return {
            id: user._id,
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            isEmailVerified: user.isEmailVerified,
            operatorPermissions: user.operatorPermissions,
            lastLoginAt: user.lastLoginAt,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mail_service_1.MailService])
], AuthService);
//# sourceMappingURL=auth.service.js.map