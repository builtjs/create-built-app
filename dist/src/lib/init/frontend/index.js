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
exports.installFrontendSite = installFrontendSite;
exports.installFrontendThemeOrPlugin = installFrontendThemeOrPlugin;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const utils_1 = require("../../../utils");
const constants_1 = require("../../../constants");
const apiKeyUtils_1 = require("../../apiKeyUtils");
async function installFrontendSite(frontendPath, rootDir, cms) {
    return new Promise(async (resolve, reject) => {
        console.log(chalk_1.default.blue(`Installing site...`));
        const srcPath = `${frontendPath}${rootDir}`;
        let frontendConfigPath = constants_1.Constants.SITE_FRONTEND_DIR;
        let errorMsg = getInvalidSiteError(cms);
        if (errorMsg) {
            return reject(errorMsg);
        }
        try {
            //-> Moving .env file to frontend project
            (0, utils_1.copyRecursiveSync)(`${frontendConfigPath}/.env`, `${frontendPath}/.env`);
        }
        catch (error) {
            console.error(`No "${frontendConfigPath}/.env" directory found. Skipping...`);
        }
        try {
            //-> Moving hooks directory to frontend project
            (0, utils_1.copyRecursiveSync)(`${frontendConfigPath}/hooks`, `${srcPath}/hooks`);
        }
        catch (error) { }
        try {
            //-> Moving setup directory to frontend project
            (0, utils_1.copyRecursiveSync)(`${frontendConfigPath}/setup`, `${srcPath}/setup`);
        }
        catch (error) {
            console.error('An error occurred when moving the config/setup directory to the frontend project. Are you sure it exists?');
        }
        try {
            fs.rmSync(`${frontendPath}/styles`, { recursive: true, force: true });
            move(`${frontendConfigPath}/styles`, `${srcPath}/styles`);
        }
        catch (error) { }
        try {
            move(`${frontendConfigPath}/lib`, `${srcPath}/lib`);
        }
        catch (error) { }
        if (cms === 'sanity') {
            const sanityPath = `${srcPath}/sanity`;
            fs.mkdirSync(sanityPath, { recursive: true });
            move(`${frontendConfigPath}/sanity`, sanityPath);
        }
        await moveCommon(frontendConfigPath, frontendPath);
        let hasAppFile = false;
        if ((0, utils_1.exists)(`${frontendConfigPath}/pages/_app.tsx`)) {
            hasAppFile = true;
        }
        let appData;
        let appPath = `${srcPath}/pages/_app.tsx`;
        try {
            if (!hasAppFile) {
                appData = await fs.promises.readFile(appPath, 'utf8');
            }
            fs.rmSync(`${srcPath}/pages`, { recursive: true, force: true });
            move(`${frontendConfigPath}/pages`, `${srcPath}/pages`);
            if (appData) {
                fs.writeFile(appPath, appData, function (err) {
                    if (err)
                        return console.log(err);
                });
            }
        }
        catch (error) {
            // do nothing
        }
        move(`${frontendConfigPath}/pages/api`, `${srcPath}/pages/api`);
        fs.rmSync(`${frontendPath}/public`, { recursive: true, force: true });
        move(`${frontendConfigPath}/public`, `${frontendPath}/public`);
        // Finished installing frontend
        return resolve();
    });
}
function moveCommon(src, dest) {
    return new Promise(async (resolve) => {
        try {
            //-> Moving index.d.js file to frontend project
            (0, utils_1.copyRecursiveSync)(`${src}/index.d.js`, `${dest}/index.d.js`);
        }
        catch (error) {
            try {
                //-> Moving index.d.ts file to frontend project
                (0, utils_1.copyRecursiveSync)(`${src}/index.d.ts`, `${dest}/index.d.ts`);
            }
            catch (error) {
                // do nothing
            }
        }
        let tailwindConfigPath = '';
        try {
            //-> Moving tailwind.config.js to frontend project
            try {
                fs.rmSync(`${dest}/tailwind.config.ts`);
            }
            catch (error) {
                // do nothing
            }
            (0, utils_1.copyRecursiveSync)(`${src}/tailwind.config.js`, `${dest}/tailwind.config.js`);
            tailwindConfigPath = `${dest}/tailwind.config.js`;
        }
        catch (error) {
            try {
                try {
                    fs.rmSync(`${dest}/tailwind.config.js`);
                }
                catch (error) {
                    // do nothing
                }
                //-> Moving tailwind.config.ts to frontend project
                (0, utils_1.copyRecursiveSync)(`${src}/tailwind.config.ts`, `${dest}/tailwind.config.ts`);
                tailwindConfigPath = `${dest}/tailwind.config.ts`;
            }
            catch (error) { }
        }
        try {
            let tailwindConfigData = await fs.readFileSync(tailwindConfigPath, 'utf-8');
            tailwindConfigData = tailwindConfigData.replace(/src\//g, '');
            await fs.writeFileSync(tailwindConfigPath, tailwindConfigData);
        }
        catch (error) {
            console.error('Error processing the Tailwind config file:', error);
        }
        try {
            (0, utils_1.copyRecursiveSync)(`${src}/README.site.md`, `${dest}/README.md`);
        }
        catch (error) { }
        try {
            //-> Moving postcss.config.js to frontend project
            (0, utils_1.copyRecursiveSync)(`${src}/postcss.config.js`, `${dest}/postcss.config.js`);
        }
        catch (error) {
            try {
                //-> Moving postcss.config.ts to frontend project
                (0, utils_1.copyRecursiveSync)(`${src}/postcss.config.ts`, `${dest}/postcss.config.ts`);
            }
            catch (error) { }
        }
        try {
            fs.rmSync(`${dest}/next.config.mjs`);
        }
        catch (error) {
            try {
                fs.rmSync(`${dest}/next.config.ts`);
            }
            catch (error) {
                try {
                    fs.rmSync(`${dest}/next.config.js`);
                }
                catch (error) {
                    //do nothing
                }
            }
        }
        try {
            //-> Moving next.config.js file to frontend project
            (0, utils_1.copyRecursiveSync)(`${src}/next.config.js`, `${dest}/next.config.js`);
        }
        catch (error) {
            try {
                //-> Moving next.config.ts file to frontend project
                (0, utils_1.copyRecursiveSync)(`${src}/next.config.ts`, `${dest}/next.config.ts`);
            }
            catch (error) {
                // do nothing
            }
        }
        move(`${src}/components`, `${dest}/components`);
        move(`${src}/lib`, `${dest}/lib`);
        return resolve();
    });
}
async function installFrontendThemeOrPlugin(frontendPath, rootDir, type, themeOrPlugin) {
    let apiKey = await (0, apiKeyUtils_1.getApiKey)();
    if (!apiKey) {
        console.error('Unable to process API key.');
        process.exit(1);
    }
    const isValid = await (0, apiKeyUtils_1.validateApiKey)(apiKey);
    if (!isValid) {
        apiKey = await (0, apiKeyUtils_1.promptForApiKey)();
    }
    await (0, apiKeyUtils_1.saveApiKeyToConfig)(apiKey);
    let srcPath = `${frontendPath}${rootDir}`;
    let errorMsg = getInvalidThemeError();
    if (errorMsg) {
        console.error(errorMsg);
        return;
    }
    let typeQuery = 'theme';
    if (type) {
        typeQuery = type;
    }
    if (!themeOrPlugin) {
        console.error('Error: It looks like this not a theme or plugin.');
        process.exit(1);
    }
    console.log(chalk_1.default.blue(`Installing ${type}...`));
    let namespace;
    try {
        const appData = fs.readFileSync(`${constants_1.Constants.CONFIG_PREFIX}/${type}.json`);
        const app = JSON.parse(appData)[type];
        if (app.namespace) {
            namespace = app.namespace;
        }
    }
    catch (error) { }
    await moveCommon(constants_1.Constants.CONFIG_PREFIX, frontendPath);
    movePages(srcPath, type, namespace);
    fs.rmSync(`${srcPath}/api`, { recursive: true, force: true });
    fs.rmSync(`${srcPath}/styles`, { recursive: true, force: true });
    move(constants_1.Constants.THEME_STYLES_DIR, `${srcPath}/styles`);
    fs.rmSync(`${frontendPath}/public`, { recursive: true, force: true });
    move(constants_1.Constants.THEME_PUBLIC_DIR, `${frontendPath}/public`);
    move(constants_1.Constants.THEME_HOOKS_DIR, `${srcPath}/hooks`);
    console.log(chalk_1.default.green(`✓ Done!`));
    // Finished installing
}
function move(from, to) {
    try {
        (0, utils_1.copyRecursiveSync)(from, to);
        return true;
    }
    catch (error) {
        console.error(`'${from}' not found. Skipping...`);
        return false;
    }
}
async function movePages(srcPath, type, namespace) {
    const appPath = `${srcPath}/pages/_app.tsx`;
    let appData = await fs.promises.readFile(appPath, 'utf8');
    fs.rmSync(`${srcPath}/pages`, { recursive: true, force: true });
    move(constants_1.Constants.THEME_PAGES_DIR, `${srcPath}/pages`);
    if (appData) {
        if (type === constants_1.Constants.TYPES.plugin && namespace) {
            let cssString = `@/styles/${type}s/${namespace}/globals.css`;
            appData = appData.replace(`@/styles/globals.css`, cssString);
        }
        await fs.promises.writeFile(appPath, appData);
    }
}
function getInvalidSiteError(cms) {
    let msg = '';
    if (!(0, utils_1.exists)(constants_1.Constants.SITE_FRONTEND_DIR)) {
        msg += `${constants_1.Constants.errorMessages.FRONTEND_NOT_FOUND} `;
    }
    if (cms === constants_1.Constants.CMS.strapi && !(0, utils_1.exists)(constants_1.Constants.SITE_BACKEND_DIR)) {
        msg += `${constants_1.Constants.errorMessages.BACKEND_NOT_FOUND} `;
    }
    if (msg) {
        msg += constants_1.Constants.errorMessages.CANNOT_PROCEED;
    }
    return msg;
}
function getInvalidThemeError() {
    let msg = '';
    if (!(0, utils_1.exists)(constants_1.Constants.THEME_PUBLIC_DIR)) {
        msg += `${constants_1.Constants.errorMessages.PUBLIC_NOT_FOUND} `;
    }
    if (!(0, utils_1.exists)(constants_1.Constants.THEME_LIB_DIR)) {
        msg += `${constants_1.Constants.errorMessages.LIB_NOT_FOUND} `;
    }
    if (msg) {
        msg = 'Error: ' + msg + constants_1.Constants.errorMessages.CANNOT_PROCEED;
    }
    return msg;
}
