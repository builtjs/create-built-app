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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = init;
const chalk_1 = __importDefault(require("chalk"));
const frontend_1 = require("../lib/init/frontend");
const fs = __importStar(require("fs"));
const utils_1 = require("../utils");
const constants_1 = require("../constants");
const setup_1 = require("./setup");
const appMap = {};
const DEFAULT_CMS = 'sanity';
function getDirectories(path) {
    return fs.readdirSync(path).filter(function (file) {
        const blacklist = ['.git', 'build', 'config', 'node_modules', 'src'];
        return (!blacklist.includes(file) && fs.statSync(path + '/' + file).isDirectory());
    });
}
/**
 * To run:
 * npm run prepare
 * node build/src/index.js init
 */
async function init(options) {
    let { cms } = options;
    if (!cms) {
        cms = DEFAULT_CMS;
    }
    const dirs = getDirectories('./');
    let themeOrPlugin = await (0, setup_1.getThemeOrPlugin)('theme', true);
    if (themeOrPlugin) {
        installThemeOrPlugin(dirs, 'theme', themeOrPlugin);
    }
    else {
        themeOrPlugin = await (0, setup_1.getThemeOrPlugin)('plugin', true);
        if (themeOrPlugin) {
            installThemeOrPlugin(dirs, 'plugin', themeOrPlugin);
        }
        else {
            installSite(dirs, cms);
        }
    }
}
async function installThemeOrPlugin(dirs, type, themeOrPlugin) {
    getDep(dirs, constants_1.Constants.DEPS.next);
    if (!appMap[constants_1.Constants.DEPS.next]) {
        console.error('No Next.js project found. Did you remember to create it? See README.md for more details.');
        process.exit(1);
    }
    let frontendPath = appMap[constants_1.Constants.DEPS.next];
    let rootDir = '/src';
    let srcPath = `${frontendPath}${rootDir}`;
    if (!(0, utils_1.exists)(srcPath)) {
        rootDir = '';
    }
    (0, frontend_1.installFrontendThemeOrPlugin)(appMap[constants_1.Constants.DEPS.next], rootDir, type, themeOrPlugin);
}
async function installSite(dirs, cms) {
    getDep(dirs, constants_1.Constants.DEPS.next);
    getDep(dirs, constants_1.Constants.DEPS.sanity);
    if (!appMap[constants_1.Constants.DEPS.next]) {
        console.error('No Next.js found. Did you remember to create it? See README.md for more details.');
        process.exit(1);
    }
    let frontendPath = appMap[constants_1.Constants.DEPS.next];
    let rootDir = '/src';
    let srcPath = `${frontendPath}${rootDir}`;
    if (!(0, utils_1.exists)(srcPath)) {
        rootDir = '';
    }
    await (0, frontend_1.installFrontendSite)(frontendPath, rootDir, cms).catch(err => {
        console.error(err);
        return;
    });
    console.log(chalk_1.default.green(`✓ Done!`));
}
function getDep(dirs, dep) {
    for (let i = 0; i < dirs.length; i++) {
        const dir = dirs[i];
        try {
            let pkgData = fs.readFileSync(`${dir}/package.json`);
            let pkg = JSON.parse(pkgData);
            let dependencies = pkg.dependencies;
            if (dependencies[dep]) {
                appMap[dep] = dir;
            }
        }
        catch (error) { }
    }
}
