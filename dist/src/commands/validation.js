"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCreateOptions = validateCreateOptions;
function validateCreateOptions(options) {
    if (options.designSystem && !['basic', 'shadcn'].includes(options.designSystem)) {
        throw new Error('Design system must be either "basic" or "shadcn"');
    }
}
