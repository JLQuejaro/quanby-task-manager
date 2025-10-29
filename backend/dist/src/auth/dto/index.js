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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendVerificationDto = exports.VerifyEmailDto = exports.GoogleOAuthCallbackDto = exports.SetPasswordDto = exports.ChangePasswordDto = void 0;
__exportStar(require("./register.dto"), exports);
__exportStar(require("./forgot-password.dto"), exports);
__exportStar(require("./reset-password.dto"), exports);
__exportStar(require("./verify-email.dto"), exports);
__exportStar(require("./change-password.dto"), exports);
__exportStar(require("./set-password.dto"), exports);
__exportStar(require("./google-oauth-callback.dto"), exports);
class ChangePasswordDto {
}
exports.ChangePasswordDto = ChangePasswordDto;
class SetPasswordDto {
}
exports.SetPasswordDto = SetPasswordDto;
class GoogleOAuthCallbackDto {
}
exports.GoogleOAuthCallbackDto = GoogleOAuthCallbackDto;
class VerifyEmailDto {
}
exports.VerifyEmailDto = VerifyEmailDto;
class ResendVerificationDto {
}
exports.ResendVerificationDto = ResendVerificationDto;
//# sourceMappingURL=index.js.map