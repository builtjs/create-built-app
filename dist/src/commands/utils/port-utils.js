"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.findNextPort = findNextPort;
const ps_list_1 = __importDefault(require("ps-list"));
async function findNextPort() {
    const processes = await (0, ps_list_1.default)();
    // Look for Next.js development server process
    const nextProcess = processes.find(proc => {
        const command = proc.cmd || proc.name;
        return command && command.includes('next dev');
    });
    if (!nextProcess) {
        throw new Error('No Next.js development server found running');
    }
    // Extract port from the process command
    const command = nextProcess.cmd || nextProcess.name;
    const portMatch = command.match(/-p\s+(\d+)|--port\s+(\d+)|:(\d+)/);
    if (portMatch) {
        // Return the first matched port number
        const port = parseInt(portMatch[1] || portMatch[2] || portMatch[3]);
        return port;
    }
    // Default to 3000 if no port specified (Next.js default)
    return 3000;
}
