"use strict";
////////////////////////////////////////////////////////////////////////////////
// VALIDATION ERROR
////////////////////////////////////////////////////////////////////////////////
Object.defineProperty(exports, "__esModule", { value: true });
class ValidationError extends Error {
    constructor(cause, description, index, location = []) {
        super([cause, ...location.slice().reverse().map(l => displayLocation(l.description, l.index))].join("\n"));
        this.name = "ValidationError";
        this.cause = cause;
        this.location = location.slice(); // copy the old location
        this.location.unshift({ description: description, index: index }); // push the new location to the top of the stack
    }
}
exports.ValidationError = ValidationError;
function displayLocation(description, index) {
    if (index) {
        return `in: ${description} @ ${index}`;
    }
    else {
        return `in: ${description}`;
    }
}
function rethrowValidationError(error, description, index) {
    throw new ValidationError(error.cause, description, index, error.location);
}
exports.rethrowValidationError = rethrowValidationError;
//# sourceMappingURL=Error.js.map