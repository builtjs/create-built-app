"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toCamelCase = toCamelCase;
exports.toKebabCase = toKebabCase;
exports.formatComponentName = formatComponentName;
const camelcase_1 = __importDefault(require("camelcase"));
const kebab_case_1 = __importDefault(require("kebab-case"));
function toCamelCase(str) {
    return (0, camelcase_1.default)(str);
}
function toKebabCase(str) {
    return (0, kebab_case_1.default)(str);
}
function formatComponentName(baseName) {
    const timestamp = Date.now();
    const componentName = toCamelCase(`${baseName}${timestamp}`);
    const fileName = toKebabCase(componentName);
    return { componentName, fileName };
}
