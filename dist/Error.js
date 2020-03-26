"use strict";
////////////////////////////////////////////////////////////////////////////////
// VALIDATION ERROR
////////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}
exports.ValidationError = ValidationError;
//# sourceMappingURL=Error.js.map