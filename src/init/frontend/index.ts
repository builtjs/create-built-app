import * as fs from 'fs';
import {copyRecursiveSync, exists} from '../../utils';
import {Constants} from '../../constants';

export async function installFrontendSite(
  frontendPath: string,
  rootDir: string,
  cms: string
) {
  return new Promise<void>(async (resolve, reject) => {
    console.log('Installing site..');

    const srcPath = `${frontendPath}${rootDir}`;
    let frontendConfigPath = Constants.SITE_FRONTEND_DIR;
    let frontendConfigSrcPath = frontendConfigPath;
    if (fs.existsSync(`${frontendConfigPath}/src`)) {
      frontendConfigSrcPath = `${frontendConfigPath}/src`;
    }
    let errorMsg = getInvalidSiteError(cms);
    if (errorMsg) {
      return reject(errorMsg);
    }

    try {
      //-> Moving .env file to frontend project
      copyRecursiveSync(`${frontendConfigPath}/.env`, `${frontendPath}/.env`);
    } catch (error) {
      console.error(
        `No "${frontendConfigPath}/.env" directory found. Skipping...`
      );
    }

    try {
      //-> Moving setup directory to frontend project
      copyRecursiveSync(`${frontendConfigSrcPath}/setup`, `${srcPath}/setup`);
      const packagePath = `${frontendPath}/package.json`;
      let pkgData: any = fs.readFileSync(packagePath);
      let pkg = JSON.parse(pkgData);
      pkg.scripts = {
        ...pkg.scripts,
        ...{
          setup: `node ${
            rootDir !== '' ? `src/` : ''
          }setup/import-data/import-data.js`,
        },
      };
      fs.writeFile(
        packagePath,
        JSON.stringify(pkg, null, 2),
        function writeJSON(err) {
          if (err) return console.log(err);
        }
      );
    } catch (error) {
      console.error(
        'An error occurred when moving the config/setup directory to the frontend project. Are you sure it exists?'
      );
    }

    try {
      //-> Moving next.config.js file to frontend project
      copyRecursiveSync(
        `${frontendConfigPath}/next.config.js`,
        `${frontendPath}/next.config.js`
      );
    } catch (error) {
      try {
        //-> Moving next.config.ts file to frontend project
        copyRecursiveSync(
          `${frontendConfigPath}/next.config.ts`,
          `${frontendPath}/next.config.ts`
        );
      } catch (error) {
        console.error('No "next.config" file found. Skipping...');
      }
    }

    try {
      //-> Moving index.d.js file to frontend project
      copyRecursiveSync(
        `${frontendConfigPath}/index.d.js`,
        `${frontendPath}/index.d.js`
      );
    } catch (error) {
      try {
        //-> Moving next.config.ts file to frontend project
        copyRecursiveSync(
          `${frontendConfigPath}/index.d.ts`,
          `${frontendPath}/index.d.ts`
        );
      } catch (error) {
        console.error('No "index.d" file found. Skipping...');
      }
    }

    try {
      copyRecursiveSync(
        `${frontendConfigPath}/README.md`,
        `${frontendPath}/README.md`
      );
    } catch (error) {}

    try {
      fs.rmSync(`${srcPath}/styles`, {recursive: true, force: true});
      move(`${frontendConfigSrcPath}/styles`, `${srcPath}/styles`);
    } catch (error) {}

    try {
      move(`${frontendConfigSrcPath}/lib`, `${srcPath}/lib`);
    } catch (error) {}

    if (cms === 'sanity') {
      const sanityPath = `${srcPath}/sanity`;
      fs.mkdirSync(sanityPath, {recursive: true});
      move(`${frontendConfigSrcPath}/sanity`, sanityPath);
    }

    try {
      //-> Moving tailwind.config.js to frontend project
      copyRecursiveSync(
        `${frontendConfigPath}/tailwind.config.js`,
        `${frontendPath}/tailwind.config.js`
      );
    } catch (error) {
      try {
        //-> Moving tailwind.config.ts to frontend project
        copyRecursiveSync(
          `${frontendConfigPath}/tailwind.config.ts`,
          `${frontendPath}/tailwind.config.ts`
        );
      } catch (error) {}
    }

    try {
      //-> Moving postcss.config.js to frontend project
      copyRecursiveSync(
        `${frontendConfigPath}/postcss.config.js`,
        `${frontendPath}/postcss.config.js`
      );
    } catch (error) {
      try {
        //-> Moving postcss.config.ts to frontend project
        copyRecursiveSync(
          `${frontendConfigPath}/postcss.config.ts`,
          `${frontendPath}/postcss.config.ts`
        );
      } catch (error) {}
    }

    //move components

    fs.rmSync(`${srcPath}/components`, {recursive: true, force: true});
    move(`${frontendConfigSrcPath}/components`, `${srcPath}/components`);

    // move lib

    move(`${frontendConfigSrcPath}/lib`, `${srcPath}/lib`);

    // move pages

    let hasAppFile = false;
    if (
      exists(`${frontendConfigSrcPath}/pages/_app.tsx`) ||
      exists(`${frontendConfigSrcPath}/pages/_app.jsx`)
    ) {
      hasAppFile = true;
    }
    let appData: any;
    let appPath: string = `${srcPath}/pages/_app.tsx`;
    try {
      if (!hasAppFile) {
        appData = await fs.promises.readFile(appPath, 'utf8');
      }
      fs.rmSync(`${srcPath}/pages`, {recursive: true, force: true});
      move(`${frontendConfigSrcPath}/pages`, `${srcPath}/pages`);
      if (appData) {
        appData = appData.replace(`globals.css`, `index.css`);
        fs.writeFile(appPath, appData, function (err) {
          if (err) return console.log(err);
        });
      }
    } catch (error) {
      // do nothing
    }
    move(`${frontendConfigSrcPath}/pages/api`, `${srcPath}/pages/api`);

    fs.rmSync(`${frontendPath}/public`, {recursive: true, force: true});
    move(`${frontendConfigPath}/public`, `${frontendPath}/public`);
    // Finished installing frontend
    return resolve();
  });
}

export async function installFrontendThemeOrPlugin(
  frontendPath: string,
  rootDir: string,
  type: string
) {
  console.log(`Installing ${type}...`);
  let srcPath = `${frontendPath}${rootDir}`;
  let errorMsg = getInvalidThemeError();
  if (errorMsg) {
    console.error(errorMsg);
    return;
  }
  let namespace;
  if (type === 'plugin') {
    try {
      const appData: any = fs.readFileSync(
        `${Constants.CONFIG_PREFIX}/app.json`
      );
      const app = JSON.parse(appData).app;
      if (app.namespace) {
        namespace = app.namespace;
      }
    } catch (error) {}
  }

  try {
    //-> Moving setup directory to project
    copyRecursiveSync(`${Constants.CONFIG_PREFIX}/setup`, `${srcPath}/setup`);
    //update scripts
    const packagePath = `${frontendPath}/package.json`;
      let pkgData: any = fs.readFileSync(packagePath);
      let pkg = JSON.parse(pkgData);
      pkg.scripts = {
        ...pkg.scripts,
        ...{
          setup: `node ${
            rootDir !== '' ? `src/` : ''
          }setup/import-data.js`,
        },
      };
      fs.writeFile(
        packagePath,
        JSON.stringify(pkg, null, 2),
        function writeJSON(err) {
          if (err) return console.log(err);
        }
      );
  } catch (error) {
    console.error(
      'An error occurred when moving the config/setup directory to the frontend project. Are you sure it exists?'
    );
  }

  try {
    //-> Moving index.d.js file to frontend project
    copyRecursiveSync(
      `${Constants.CONFIG_PREFIX}/index.d.js`,
      `${frontendPath}/index.d.js`
    );
  } catch (error) {
    try {
      //-> Moving next.config.ts file to frontend project
      copyRecursiveSync(
        `${Constants.CONFIG_PREFIX}/index.d.ts`,
        `${frontendPath}/index.d.ts`
      );
    } catch (error) {
      console.error('No "index.d" file found. Skipping...');
    }
  }

  try {
    //-> Moving tailwind.config.js to frontend project
    copyRecursiveSync(
      `${Constants.CONFIG_PREFIX}/tailwind.config.js`,
      `${frontendPath}/tailwind.config.js`
    );
  } catch (error) {
    try {
      //-> Moving tailwind.config.ts to frontend project
      copyRecursiveSync(
        `${Constants.CONFIG_PREFIX}/tailwind.config.ts`,
        `${frontendPath}/tailwind.config.ts`
      );
    } catch (error) {}
  }

  try {
    //-> Moving index.d.js file to frontend project
    copyRecursiveSync(
      `${Constants.CONFIG_PREFIX}/builtjs-utils.js`,
      `${srcPath}/builtjs-utils.js`
    );
  } catch (error) {
    try {
      //-> Moving next.config.ts file to frontend project
      copyRecursiveSync(
        `${Constants.CONFIG_PREFIX}/builtjs-utils.ts`,
        `${srcPath}/builtjs-utils.ts`
      );
    } catch (error) {
      console.error('No "builtjs-utils" file found. Skipping...');
    }
  }

  // installDeps(frontendPath);
  move(Constants.THEME_COMPONENTS_DIR, `${srcPath}/components`);
  move(Constants.THEME_LIB_DIR, `${srcPath}/lib`);
  try {
    fs.rmSync(
      `${srcPath}/styles/${type === 'plugin' ? 'plugins' : ''}${
        namespace ? namespace + '/' : ''
      }Home.module.css`
    );
  } catch (error) {
    //do nothing
  }

  movePages(srcPath, type, namespace);
  fs.rmSync(`${srcPath}/api`, {recursive: true, force: true});

  fs.rmSync(`${srcPath}/styles`, {recursive: true, force: true});
  move(Constants.THEME_STYLES_DIR, `${srcPath}/styles`);

  fs.rmSync(`${frontendPath}/public`, {recursive: true, force: true});
  move(Constants.THEME_PUBLIC_DIR, `${frontendPath}/public`);
  // Finished installing
}

function move(from: string, to: string) {
  try {
    copyRecursiveSync(from, to);
    return true;
  } catch (error) {
    console.error(`'${from}' not found. Skipping...`);
    return false;
  }
}

async function movePages(srcPath: string, type: string, namespace: string) {
  const appPath = `${srcPath}/pages/_app.tsx`;
  let appData: any = await fs.promises.readFile(appPath, 'utf8');
  fs.rmSync(`${srcPath}/pages`, {recursive: true, force: true});
  move(Constants.THEME_PAGES_DIR, `${srcPath}/pages`);
  if (appData) {
    let cssString = `@/styles/index.css`;
    if (type === Constants.TYPES.plugin && namespace) {
      cssString = `@/styles/${type}s/${namespace}/index.css`;
    }
    appData = appData.replace(`@/styles/globals.css`, cssString);
    await fs.promises.writeFile(appPath, appData);
  }
}

function installDeps(frontendPath: string) {
  let configData: any = fs.readFileSync(
    `${Constants.CONFIG_PREFIX}/config.json`
  );
  let config = JSON.parse(configData).config;
  const packagePath = `${frontendPath}/package.json`;
  let pkgData: any = fs.readFileSync(packagePath);
  const pkg = JSON.parse(pkgData);
  pkg.dependencies = {...pkg.dependencies, ...config.dependencies};
  fs.writeFile(
    packagePath,
    JSON.stringify(pkg, null, 2),
    function writeJSON(err) {
      if (err) return console.log(err);
    }
  );
}

function getInvalidSiteError(cms: string) {
  let msg = '';
  if (!exists(Constants.SITE_FRONTEND_DIR)) {
    msg += `${Constants.errorMessages.FRONTEND_NOT_FOUND} `;
  }
  if (cms === Constants.CMS.strapi && !exists(Constants.SITE_BACKEND_DIR)) {
    msg += `${Constants.errorMessages.BACKEND_NOT_FOUND} `;
  }
  if (msg) {
    msg += Constants.errorMessages.CANNOT_PROCEED;
  }
  return msg;
}

function getInvalidThemeError() {
  let msg = '';
  if (!exists(Constants.THEME_PUBLIC_DIR)) {
    msg += `${Constants.errorMessages.PUBLIC_NOT_FOUND} `;
  }
  if (!exists(Constants.THEME_PAGES_DIR)) {
    msg += `${Constants.errorMessages.PAGES_NOT_FOUND} `;
  }
  if (!exists(Constants.THEME_COMPONENTS_DIR)) {
    msg += `${Constants.errorMessages.COMPONENTS_NOT_FOUND} `;
  }
  if (!exists(Constants.THEME_LIB_DIR)) {
    msg += `${Constants.errorMessages.LIB_NOT_FOUND} `;
  }
  if (msg) {
    msg = 'Error: ' + msg + Constants.errorMessages.CANNOT_PROCEED;
  }
  return msg;
}
