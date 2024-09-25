import {
  installFrontendSite,
  installFrontendThemeOrPlugin,
} from '../lib/init/frontend';
import * as fs from 'fs';
import {exists} from '../utils';
import {Constants} from '../constants';
import {getThemeOrPlugin} from './setup';

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
  let {cms} = options;
  if (!cms) {
    cms = DEFAULT_CMS;
  }
  const dirs = getDirectories('./');
  let themeOrPlugin = await getThemeOrPlugin('theme', true);
  if(themeOrPlugin){
    installThemeOrPlugin(dirs, 'theme', themeOrPlugin);
  }else{
    themeOrPlugin = await getThemeOrPlugin('plugin', true);
    if(themeOrPlugin){
      installThemeOrPlugin(dirs, 'plugin', themeOrPlugin);
    }else{
      installSite(dirs, cms);
    }
  }
}

async function installThemeOrPlugin(dirs: any, type:string, themeOrPlugin: any) {
  getDep(dirs, Constants.DEPS.next);
  if (!appMap[Constants.DEPS.next]) {
    console.error(
      'No Next.js project found. Did you remember to create it? See README.md for more details.'
    );
    process.exit(1);
  }

  let frontendPath = appMap[Constants.DEPS.next];
  let rootDir = '/src';
  let srcPath = `${frontendPath}${rootDir}`;
  if (!exists(srcPath)) {
    rootDir = '';
  }
  installFrontendThemeOrPlugin(appMap[Constants.DEPS.next], rootDir, type, themeOrPlugin);
}

async function installSite(dirs: any, cms: string) {
  getDep(dirs, Constants.DEPS.next);
  getDep(dirs, Constants.DEPS.sanity);
  if (!appMap[Constants.DEPS.next]) {
    console.error(
      'No Next.js found. Did you remember to create it? See README.md for more details.'
    );
    process.exit(1);
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
