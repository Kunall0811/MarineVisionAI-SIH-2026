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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
let UsersService = class UsersService {
    constructor(userModel) {
        this.userModel = userModel;
    }
    findByEmail(email, withSecrets = false) {
        const query = this.userModel.findOne({ email: email.toLowerCase().trim() });
        if (withSecrets) {
            query.select('+passwordHash +refreshTokenHash +emailVerificationTokenHash +passwordResetTokenHash');
        }
        return query.exec();
    }
    findById(id) {
        return this.userModel.findById(id).exec();
    }
    create(data) {
        return this.userModel.create(data);
    }
    updateById(id, update) {
        return this.userModel.findByIdAndUpdate(id, update, { new: true }).exec();
    }
    findAllPaginated(page = 1, limit = 20, filter = {}) {
        const skip = (page - 1) * limit;
        return Promise.all([
            this.userModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
            this.userModel.countDocuments(filter).exec(),
        ]);
    }
    deleteById(id) {
        return this.userModel.findByIdAndDelete(id).exec();
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], UsersService);
//# sourceMappingURL=users.service.js.map