import {
  installFrontendSite,
  installFrontendThemeOrPlugin,
} from '../lib/init/frontend';
import {installBackendSite} from '../lib/init/backend';
import * as fs from 'fs';
import {exists} from '../utils';
import {Constants} from '../constants';

const appMap: any = {};
const DEFAULT_CMS = 'sanity';

function getDirectories(path: string) {
  return fs.readdirSync(path).filter(function (file) {
    const blacklist = ['.git', 'build', 'config', 'node_modules', 'src'];
    return (
      !blacklist.includes(file) && fs.statSync(path + '/' + file).isDirectory()
    );
  });
}

/**
 * To run:
 * npm run prepare
 * node build/src/index.js init
 */
async function init(options: any) {
  let {type, cms} = options;
  if (!cms) {
    cms = DEFAULT_CMS;
  }
  const dirs = getDirectories('./');
  if (!type || type === Constants.TYPES.site) {
    installSite(dirs, cms);
  } else if (
    type === Constants.TYPES.theme ||
    type === Constants.TYPES.plugin
  ) {
    installThemeOrPlugin(dirs, type);
  } else {
    console.log('Type not recognized. Use "site" or "theme".');
  }
}

function installThemeOrPlugin(dirs: any, type: string) {
  getDep(dirs, Constants.DEPS.next);
  if (!appMap[Constants.DEPS.next]) {
    console.log(
      'No Next.js project found. Did you remember to create it? See README.md for more details.'
    );
    return;
  }
  let frontendPath = appMap[Constants.DEPS.next];
  let rootDir = '/src';
  let srcPath = `${frontendPath}${rootDir}`;
  if (!exists(srcPath)) {
    rootDir = '';
  }
  installFrontendThemeOrPlugin(appMap[Constants.DEPS.next], rootDir, type);
}

async function installSite(dirs: any, cms: string) {
  getDep(dirs, Constants.DEPS.next);
  getDep(dirs, Constants.DEPS.sanity);
  if (!appMap[Constants.DEPS.next]) {
    console.log(
      'No Next.js found. Did you remember to create it? See README.md for more details.'
    );
    return;
  }
  let frontendPath = appMap[Constants.DEPS.next];
  let rootDir = '/src';
  let srcPath = `${frontendPath}${rootDir}`;
  if (!exists(srcPath)) {
    rootDir = '';
  }
  await installFrontendSite(frontendPath, rootDir, cms).catch(err => {
    console.error(err);
    return;
  });

  if (cms === 'strapi') {
    installBackendSite(appMap[Constants.DEPS.strapi]);
  }

  console.log('Done!');
}

function getDep(dirs: [], dep: string) {
  for (let i = 0; i < dirs.length; i++) {
    const dir = dirs[i];
    try {
      let pkgData: any = fs.readFileSync(`${dir}/package.json`);
      let pkg = JSON.parse(pkgData);
      let dependencies = pkg.dependencies;
      if (dependencies[dep]) {
        appMap[dep] = dir;
      }
    } catch (error) {}
  }
}

export {init};
