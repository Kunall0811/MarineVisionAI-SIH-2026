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
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedDemoAccounts = seedDemoAccounts;
const bcrypt = __importStar(require("bcrypt"));
async function seedDemoAccounts(usersService, logger) {
    const accounts = [
        {
            fullName: process.env.DEMO_ADMIN_NAME || 'Admin Operator',
            email: process.env.DEMO_ADMIN_EMAIL || 'admin@marinevision.ai',
            password: process.env.DEMO_ADMIN_PASSWORD || 'Admin@12345',
            role: 'ADMIN',
        },
        {
            fullName: process.env.DEMO_OPERATOR_NAME || 'Field Operator',
            email: process.env.DEMO_OPERATOR_EMAIL || 'operator@marinevision.ai',
            password: process.env.DEMO_OPERATOR_PASSWORD || 'Operator@12345',
            role: 'OPERATOR',
        },
    ];
    for (const acct of accounts) {
        const existing = await usersService.findByEmail(acct.email);
        if (existing)
            continue;
        const passwordHash = await bcrypt.hash(acct.password, 12);
        await usersService.create({
            fullName: acct.fullName,
            email: acct.email,
            passwordHash,
            role: acct.role,
            isEmailVerified: true,
            isActive: true,
        });
        logger.log(`Seeded demo ${acct.role} account: ${acct.email}`);
    }
}
//# sourceMappingURL=seed-demo-accounts.js.map