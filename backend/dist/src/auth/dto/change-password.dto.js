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
exports.ChangePasswordDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class ChangePasswordDto {
}
exports.ChangePasswordDto = ChangePasswordDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current password for validation' }),
    (0, class_validator_1.IsString)({ message: 'Current password must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Current password is required' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "currentPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        minLength: 8,
        description: 'New password (at least 8 characters with uppercase, lowercase, number, and special character)'
    }),
    (0, class_validator_1.IsString)({ message: 'New password must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'New password is required' }),
    (0, class_validator_1.MinLength)(8, { message: 'New password must be at least 8 characters long' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPassword", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ minLength: 8, description: 'Confirmation of new password' }),
    (0, class_validator_1.IsString)({ message: 'New password confirmation must be a string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'New password confirmation is required' }),
    (0, class_validator_1.MinLength)(8, { message: 'New password confirmation must be at least 8 characters long' }),
    __metadata("design:type", String)
], ChangePasswordDto.prototype, "newPasswordConfirm", void 0);
//# sourceMappingURL=change-password.dto.js.map