"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTemplateId = generateTemplateId;
const nanoid_1 = require("nanoid");
// Create a nanoid function with a custom alphabet for shorter, URL-friendly IDs
const generateShortId = (0, nanoid_1.customAlphabet)('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 6);
function generateTemplateId(baseName) {
    const uniqueId = generateShortId();
    return `${baseName}${uniqueId}`;
}
