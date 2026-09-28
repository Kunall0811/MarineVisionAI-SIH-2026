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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const bcrypt = __importStar(require("bcrypt"));
const user_schema_1 = require("../modules/users/schemas/user.schema");
async function run() {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/marinevision';
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_NAME || 'System Administrator';
    if (!email || !password) {
        console.error('ADMIN_EMAIL and ADMIN_PASSWORD environment variables are required.');
        process.exit(1);
    }
    await mongoose_1.default.connect(uri);
    const UserModel = mongoose_1.default.model(user_schema_1.User.name, user_schema_1.UserSchema);
    const passwordHash = await bcrypt.hash(password, 12);
    const existing = await UserModel.findOne({ email: email.toLowerCase() });
    if (existing) {
        existing.role = 'ADMIN';
        existing.isEmailVerified = true;
        existing.isActive = true;
        await existing.save();
        console.log(`Existing user ${email} promoted to ADMIN.`);
    }
    else {
        await UserModel.create({
            fullName,
            email: email.toLowerCase(),
            passwordHash,
            role: 'ADMIN',
            isEmailVerified: true,
            isActive: true,
        });
        console.log(`Admin account created: ${email}`);
    }
    await mongoose_1.default.disconnect();
}
run().catch((err) => {
    console.error('Admin seeding failed:', err);
    process.exit(1);
});
//# sourceMappingURL=seed-admin.js.map