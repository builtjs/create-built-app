import * as fs from 'fs';
import {copyRecursiveSync, exists} from '../../../utils';
import {Constants} from '../../../constants';
import {update} from '../../setup/setup-theme/setup-theme';
import {getThemeOrPlugin} from '../../../commands/setup';
import {
  getApiKey,
  promptForApiKey,
  saveApiKeyToConfig,
  validateApiKey,
} from '../../apiKeyUtils';

export async function installFrontendSite(
  frontendPath: string,
  rootDir: string,
  cms: string
) {
  return new Promise<void>(async (resolve, reject) => {
    console.log('Installing site...');

    const srcPath = `${frontendPath}${rootDir}`;
    let frontendConfigPath = Constants.SITE_FRONTEND_DIR;

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
      copyRecursiveSync(`${frontendConfigPath}/setup`, `${srcPath}/setup`);
      // const packagePath = `${frontendPath}/package.json`;
      // let pkgData: any = fs.readFileSync(packagePath);
      // let pkg = JSON.parse(pkgData);
      // pkg.scripts = {
      //   ...pkg.scripts,
      //   ...{
      //     setup: `node ${
      //       rootDir !== '' ? `src/` : ''
      //     }setup/import-data/import-data.js`,
      //   },
      // };
      // fs.writeFile(
      //   packagePath,
      //   JSON.stringify(pkg, null, 2),
      //   function writeJSON(err) {
      //     if (err) return console.log(err);
      //   }
      // );
    } catch (error) {
      console.error(
        'An error occurred when moving the config/setup directory to the frontend project. Are you sure it exists?'
      );
    }

    try {
      //-> Moving ibuiltjs-utilsfile to frontend project
      copyRecursiveSync(
        `${frontendConfigPath}/builtjs-utils.js`,
        `${srcPath}/builtjs-utils.js`
      );
    } catch (error) {
      try {
        //-> Moving builtjs-utils file to frontend project
        copyRecursiveSync(
          `${frontendConfigPath}/builtjs-utils.ts`,
          `${srcPath}/builtjs-utils.ts`
        );
      } catch (error) {
        console.error('No "builtjs-utils" file found. Skipping...');
      }
    }

    // try {
    //   fs.rmSync(`${frontendPath}/next.config.mjs`);
    // } catch (error) {
    //   try {
    //     fs.rmSync(`${frontendPath}/next.config.ts`);
    //   } catch (error) {
    //     try {
    //       fs.rmSync(`${frontendPath}/next.config.js`);
    //     } catch (error) {
    //       //do nothing
    //     }
    //   }
    // }
    // try {
    //   //-> Moving next.config.js file to frontend project
    //   copyRecursiveSync(
    //     `${frontendConfigPath}/next.config.js`,
    //     `${frontendPath}/next.config.js`
    //   );
    // } catch (error) {
    //   try {
    //     //-> Moving next.config.ts file to frontend project
    //     copyRecursiveSync(
    //       `${frontendConfigPath}/next.config.ts`,
    //       `${frontendPath}/next.config.ts`
    //     );
    //   } catch (error) {
    //     console.error('No "next.config" file found. Skipping...');
    //   }
    // }

    // try {
    //   //-> Moving index.d.js file to frontend project
    //   copyRecursiveSync(
    //     `${frontendConfigPath}/index.d.js`,
    //     `${frontendPath}/index.d.js`
    //   );
    // } catch (error) {
    //   try {
    //     //-> Moving next.config.ts file to frontend project
    //     copyRecursiveSync(
    //       `${frontendConfigPath}/index.d.ts`,
    //       `${frontendPath}/index.d.ts`
    //     );
    //   } catch (error) {
    //     console.error('No "index.d" file found. Skipping...');
    //   }
    // }

    // try {
    //   copyRecursiveSync(
    //     `${frontendConfigPath}/README.site.md`,
    //     `${frontendPath}/README.md`
    //   );
    // } catch (error) {}

    try {
      fs.rmSync(`${frontendPath}/styles`, {recursive: true, force: true});
      move(`${frontendConfigPath}/styles`, `${srcPath}/styles`);
    } catch (error) {}

    try {
      move(`${frontendConfigPath}/lib`, `${srcPath}/lib`);
    } catch (error) {}

    if (cms === 'sanity') {
      const sanityPath = `${srcPath}/sanity`;
      fs.mkdirSync(sanityPath, {recursive: true});
      move(`${frontendConfigPath}/sanity`, sanityPath);
    }

    // try {
    //   fs.rmSync(`${frontendPath}/tailwind.config.ts`);
    // } catch (error) {
    //   try {
    //     fs.rmSync(`${frontendPath}/tailwind.config.js`);
    //   } catch (error) {
    //     //do nothing
    //   }
    // }
    //    let tailwindConfigPath = ``;
    // let tailwindConfigData: any = null;
    // try {
    //   //-> Moving tailwind.config.js to frontend project

    //   copyRecursiveSync(
    //     `${frontendConfigPath}/tailwind.config.js`,
    //     `${frontendPath}/tailwind.config.js`
    //   );
    //   tailwindConfigPath = `${frontendPath}/tailwind.config.js`;
    // } catch (error) {
    //   try {
    //     //-> Moving tailwind.config.ts to frontend project
    //     copyRecursiveSync(
    //       `${frontendConfigPath}/tailwind.config.ts`,
    //       `${frontendPath}/tailwind.config.ts`
    //     );
    //     tailwindConfigPath = `${frontendPath}/tailwind.config.js`;
    //   } catch (error) {}
    // }
    // try {
    //   let tailwindConfigData = await fs.readFileSync(
    //     tailwindConfigPath,
    //     'utf-8'
    //   );
    //   tailwindConfigData = tailwindConfigData.replace(/src\//g, '');
    //   await fs.writeFileSync(tailwindConfigPath, tailwindConfigData);
    // } catch (error) {
    //   console.error('Error processing the Tailwind config file:', error);
    // }

    // try {
    //   fs.rmSync(`${frontendPath}/postcss.config.mjs`);
    // } catch (error) {
    //   try {
    //     fs.rmSync(`${frontendPath}/postcss.config.ts`);
    //   } catch (error) {
    //     try {
    //       fs.rmSync(`${frontendPath}/postcss.config.js`);
    //     } catch (error) {
    //       //do nothing
    //     }
    //   }
    // }

    // try {
    //   //-> Moving postcss.config.js to frontend project
    //   copyRecursiveSync(
    //     `${frontendConfigPath}/postcss.config.js`,
    //     `${frontendPath}/postcss.config.js`
    //   );
    // } catch (error) {
    //   try {
    //     //-> Moving postcss.config.ts to frontend project
    //     copyRecursiveSync(
    //       `${frontendConfigPath}/postcss.config.ts`,
    //       `${frontendPath}/postcss.config.ts`
    //     );
    //   } catch (error) {}
    // }

    //move components

    // fs.rmSync(`${srcPath}/components`, {recursive: true, force: true});
    // move(`${frontendConfigPath}/components`, `${srcPath}/components`);

    // move lib

    // move(`${frontendConfigPath}/lib`, `${srcPath}/lib`);

    // move pages

    await moveCommon(frontendConfigPath, frontendPath);

    let hasAppFile = false;
    if (exists(`${frontendConfigPath}/pages/_app.tsx`)) {
      hasAppFile = true;
    }
    let appData: any;
    let appPath: string = `${srcPath}/pages/_app.tsx`;
    try {
      if (!hasAppFile) {
        appData = await fs.promises.readFile(appPath, 'utf8');
      }
      fs.rmSync(`${srcPath}/pages`, {recursive: true, force: true});
      move(`${frontendConfigPath}/pages`, `${srcPath}/pages`);
      if (appData) {
        appData = appData.replace(`globals.css`, `index.css`);
        fs.writeFile(appPath, appData, function (err) {
          if (err) return console.log(err);
        });
      }
    } catch (error) {
      // do nothing
    }
    move(`${frontendConfigPath}/pages/api`, `${srcPath}/pages/api`);

    fs.rmSync(`${frontendPath}/public`, {recursive: true, force: true});
    move(`${frontendConfigPath}/public`, `${frontendPath}/public`);
    // Finished installing frontend
    return resolve();
  });
}

function moveCommon(src: string, dest: string) {
  //site: src: frontendConfigPath, dest: frontendPath
  //themeOrPlugin: src: Constants.CONFIG_PREFIX, dest: frontendPath
  return new Promise<void>(async resolve => {
    try {
      //-> Moving index.d.js file to frontend project
      copyRecursiveSync(`${src}/index.d.js`, `${dest}/index.d.js`);
    } catch (error) {
      try {
        //-> Moving index.d.ts file to frontend project
        copyRecursiveSync(`${src}/index.d.ts`, `${dest}/index.d.ts`);
      } catch (error) {
        console.error('No "index.d" file found. Skipping...');
      }
      let tailwindConfigPath = '';
      try {
        //-> Moving tailwind.config.js to frontend project
        try {
          fs.rmSync(`${dest}/tailwind.config.ts`);
        } catch (error) {
          // do nothing
        }
        copyRecursiveSync(
          `${src}/tailwind.config.js`,
          `${dest}/tailwind.config.js`
        );
        tailwindConfigPath = `${dest}/tailwind.config.js`;
      } catch (error) {
        try {
          try {
            fs.rmSync(`${dest}/tailwind.config.js`);
          } catch (error) {
            // do nothing
          }

          //-> Moving tailwind.config.ts to frontend project
          copyRecursiveSync(
            `${src}/tailwind.config.ts`,
            `${dest}/tailwind.config.ts`
          );
          tailwindConfigPath = `${dest}/tailwind.config.ts`;
        } catch (error) {}
      }
      try {
        let tailwindConfigData = await fs.readFileSync(
          tailwindConfigPath,
          'utf-8'
        );
        tailwindConfigData = tailwindConfigData.replace(/src\//g, '');
        await fs.writeFileSync(tailwindConfigPath, tailwindConfigData);
      } catch (error) {
        console.error('Error processing the Tailwind config file:', error);
      }
    }

    try {
      copyRecursiveSync(`${src}/README.site.md`, `${dest}/README.md`);
    } catch (error) {}

    try {
      fs.rmSync(`${dest}/postcss.config.mjs`);
    } catch (error) {
      try {
        fs.rmSync(`${dest}/postcss.config.ts`);
      } catch (error) {
        try {
          fs.rmSync(`${dest}/postcss.config.js`);
        } catch (error) {
          //do nothing
        }
      }
    }

    try {
      fs.rmSync(`${dest}/postcss.config.mjs`);
    } catch (error) {
      try {
        fs.rmSync(`${dest}/postcss.config.ts`);
      } catch (error) {
        try {
          fs.rmSync(`${dest}/postcss.config.js`);
        } catch (error) {
          //do nothing
        }
      }
    }

    try {
      //-> Moving postcss.config.js to frontend project
      copyRecursiveSync(
        `${src}/postcss.config.js`,
        `${dest}/postcss.config.js`
      );
    } catch (error) {
      try {
        //-> Moving postcss.config.ts to frontend project
        copyRecursiveSync(
          `${src}/postcss.config.ts`,
          `${dest}/postcss.config.ts`
        );
      } catch (error) {}
    }

    try {
      fs.rmSync(`${dest}/postcss.config.mjs`);
    } catch (error) {
      try {
        fs.rmSync(`${dest}/postcss.config.ts`);
      } catch (error) {
        try {
          fs.rmSync(`${dest}/postcss.config.js`);
        } catch (error) {
          //do nothing
        }
      }
    }

    try {
      //-> Moving postcss.config.js to frontend project
      copyRecursiveSync(
        `${src}/postcss.config.js`,
        `${dest}/postcss.config.js`
      );
    } catch (error) {
      try {
        //-> Moving postcss.config.ts to frontend project
        copyRecursiveSync(
          `${src}/postcss.config.ts`,
          `${dest}/postcss.config.ts`
        );
      } catch (error) {}
    }

    try {
      //-> Moving builtjs-utils.js file to frontend project
      copyRecursiveSync(`${src}/builtjs-utils.js`, `${dest}/builtjs-utils.js`);
    } catch (error) {
      try {
        //-> Moving builtjs-utils.ts file to frontend project
        copyRecursiveSync(
          `${src}/builtjs-utils.ts`,
          `${dest}/builtjs-utils.ts`
        );
      } catch (error) {
        console.error('No "builtjs-utils" file found. Skipping...');
      }
    }
    try {
      fs.rmSync(`${dest}/next.config.mjs`);
    } catch (error) {
      try {
        fs.rmSync(`${dest}/next.config.ts`);
      } catch (error) {
        try {
          fs.rmSync(`${dest}/next.config.js`);
        } catch (error) {
          //do nothing
        }
      }
    }
    try {
      //-> Moving next.config.js file to frontend project
      copyRecursiveSync(`${src}/next.config.js`, `${dest}/next.config.js`);
    } catch (error) {
      try {
        //-> Moving next.config.ts file to frontend project
        copyRecursiveSync(`${src}/next.config.ts`, `${dest}/next.config.ts`);
      } catch (error) {
        console.error('No "next.config" file found. Skipping...');
      }
    }

    move(`${src}/components`, `${dest}/components`);
    move(`${src}/lib`, `${dest}/lib`);
    return resolve();
  });
}

export async function installFrontendThemeOrPlugin(
  frontendPath: string,
  rootDir: string,
  type: string,
  themeOrPlugin: any
) {
  let apiKey = await getApiKey();
  if (!apiKey) {
    console.error('Unable to process API key.');
    process.exit(1);
  }

  const isValid = await validateApiKey(apiKey);
  if (!isValid) {
    apiKey = await promptForApiKey();
  }
  await saveApiKeyToConfig(apiKey);
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

  // let themeOrPlugin = await getThemeOrPlugin(typeQuery);
  // if (!themeOrPlugin) {
  //   if (type) {
  //     console.log(`No ${type}.json file found.`);
  //     process.exit(1);
  //   } else {
  //     typeQuery = 'plugin';
  //     themeOrPlugin = await getThemeOrPlugin(typeQuery);
  //   }
  // } else {
  //   if (!type) {
  //     type = typeQuery;
  //   }
  // }
  if (!themeOrPlugin) {
    console.error('Error: It looks like this not a theme or plugin.');
    process.exit(1);
  }
  console.log(`Installing ${type}...`);
  //  if(type === 'theme'){
  //   const theme = await getThemeOrPlugin('theme',true);
  //   if (!theme) {
  //     console.error(
  //       `Error: Project needs to include a public/data/theme.json file.`
  //     );
  //     process.exit(1);
  //   }
  // console.log('Installing plugins...')
  let namespace;
  // if (type === 'plugin') {
  try {
    const appData: any = fs.readFileSync(
      `${Constants.CONFIG_PREFIX}/${type}.json`
    );
    const app = JSON.parse(appData)[type];
    if (app.namespace) {
      namespace = app.namespace;
    }
  } catch (error) {}

  console.log({frontendPath})
  await moveCommon(Constants.CONFIG_PREFIX, frontendPath);
  movePages(srcPath, type, namespace);
  fs.rmSync(`${srcPath}/api`, {recursive: true, force: true});

  fs.rmSync(`${srcPath}/styles`, {recursive: true, force: true});
  move(Constants.THEME_STYLES_DIR, `${srcPath}/styles`);

  fs.rmSync(`${frontendPath}/public`, {recursive: true, force: true});
  move(Constants.THEME_PUBLIC_DIR, `${frontendPath}/public`);
  // await update(themeOrPlugin, type, apiKey, frontendPath, true);
  // }


  // }

  // try {
  //   //-> Moving setup directory to project
  //   copyRecursiveSync(`${Constants.CONFIG_PREFIX}/setup`, `${srcPath}/setup`);
  //   //update scripts
  //   const packagePath = `${frontendPath}/package.json`;
  //   let pkgData: any = fs.readFileSync(packagePath);
  //   let pkg = JSON.parse(pkgData);
  //   pkg.scripts = {
  //     ...pkg.scripts,
  //     ...{
  //       setup: `node ${rootDir !== '' ? `src/` : ''}setup/import-data.js`,
  //     },
  //   };
  //   fs.writeFile(
  //     packagePath,
  //     JSON.stringify(pkg, null, 2),
  //     function writeJSON(err) {
  //       if (err) return console.log(err);
  //     }
  //   );
  // } catch (error) {
  //   console.error(
  //     'An error occurred when moving the config/setup directory to the frontend project. Are you sure it exists?'
  //   );
  // }

  // try {
  //   //-> Moving index.d.js file to frontend project
  //   copyRecursiveSync(
  //     `${Constants.CONFIG_PREFIX}/index.d.js`,
  //     `${frontendPath}/index.d.js`
  //   );
  // } catch (error) {
  //   try {
  //     //-> Moving index.d.ts file to frontend project
  //     copyRecursiveSync(
  //       `${Constants.CONFIG_PREFIX}/index.d.ts`,
  //       `${frontendPath}/index.d.ts`
  //     );
  //   } catch (error) {
  //     console.error('No "index.d" file found. Skipping...');
  //   }
  // }

  // try {
  //   fs.rmSync(`${frontendPath}/tailwind.config.ts`);
  // } catch (error) {
  //   try {
  //     fs.rmSync(`${frontendPath}/tailwind.config.js`);
  //   } catch (error) {
  //     //do nothing
  //   }
  // }

  // try {
  //   //-> Moving tailwind.config.js to frontend project
  //   copyRecursiveSync(
  //     `${Constants.CONFIG_PREFIX}/tailwind.config.js`,
  //     `${frontendPath}/tailwind.config.js`
  //   );
  // } catch (error) {
  //   try {
  //     //-> Moving tailwind.config.ts to frontend project
  //     copyRecursiveSync(
  //       `${Constants.CONFIG_PREFIX}/tailwind.config.ts`,
  //       `${frontendPath}/tailwind.config.ts`
  //     );
  //   } catch (error) {}
  // }

  // try {
  //   fs.rmSync(`${frontendPath}/postcss.config.mjs`);
  // } catch (error) {
  //   try {
  //     fs.rmSync(`${frontendPath}/postcss.config.ts`);
  //   } catch (error) {
  //     try {
  //       fs.rmSync(`${frontendPath}/postcss.config.js`);
  //     } catch (error) {
  //       //do nothing
  //     }
  //   }
  // }

  // try {
  //   //-> Moving postcss.config.js to frontend project
  //   copyRecursiveSync(
  //     `${Constants.CONFIG_PREFIX}/postcss.config.js`,
  //     `${frontendPath}/postcss.config.js`
  //   );
  // } catch (error) {
  //   try {
  //     //-> Moving postcss.config.ts to frontend project
  //     copyRecursiveSync(
  //       `${Constants.CONFIG_PREFIX}/postcss.config.ts`,
  //       `${frontendPath}/postcss.config.ts`
  //     );
  //   } catch (error) {}
  // }

  // console.log(`${Constants.CONFIG_PREFIX}/builtjs-utils.js`)
  // console.log(`${srcPath}/builtjs-utils.ts`)
  // try {
  //   //-> Moving builtjs-utilsjs file to frontend project
  //   copyRecursiveSync(
  //     `${Constants.CONFIG_PREFIX}/builtjs-utils.js`,
  //     `${srcPath}/builtjs-utils.js`
  //   );
  // } catch (error) {
  //   try {
  //     //-> Moving builtjs-utils.ts file to frontend project
  //     copyRecursiveSync(
  //       `${Constants.CONFIG_PREFIX}/builtjs-utils.ts`,
  //       `${srcPath}/builtjs-utils.ts`
  //     );
  //   } catch (error) {
  //     console.error('No "builtjs-utils" file found. Skipping...');
  //   }
  // }

  // installDeps(frontendPath);
  // move(Constants.THEME_COMPONENTS_DIR, `${srcPath}/components`);
  // move(Constants.THEME_LIB_DIR, `${srcPath}/lib`);
  // try {
  //   fs.rmSync(
  //     `${srcPath}/styles/${type === 'plugin' ? 'plugins' : ''}${
  //       namespace ? namespace + '/' : ''
  //     }Home.module.css`
  //   );
  // } catch (error) {
  //   //do nothing
  // }



  console.log('Done!');
  // Finished installing
}

function move(from: string, to: string) {
  try {
    console.log(`Moving from ${from} to ${to}...`);
    copyRecursiveSync(from, to);
    console.log(`Move from ${from} to ${to} completed.`);
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
  if (!exists(Constants.THEME_LIB_DIR)) {
    msg += `${Constants.errorMessages.LIB_NOT_FOUND} `;
  }
  if (msg) {
    msg = 'Error: ' + msg + Constants.errorMessages.CANNOT_PROCEED;
  }
  return msg;
}
