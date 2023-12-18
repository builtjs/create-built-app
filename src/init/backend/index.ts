import * as fs from 'fs';
import {copyRecursiveSync} from '../../utils';

export async function installBackendSite(backendPath: string) {
  console.log('Installing backend...');
  try {
    if (fs.existsSync(`config/backend/index.js`)) {
      //-> Moving index.js to backend project
      fs.rmSync(`${backendPath}/src/index.js`, {force: true});
      fs.copyFile(
        'config/backend/index.js',
        `${backendPath}/src/index.js`,
        err => {
          if (err) throw err;
        }
      );
    }
  } catch (error) {
    console.error(
      'An error occurred when moving the config/backend/index.js file to the backend project'
    );
  }
  try {
    //-> Moving setup directory to backend project
    copyRecursiveSync('config/backend/setup', `${backendPath}/config/setup`);
  } catch (error) {
    console.error(
      'An error occurred when moving the config/backend/setup directory to the backend project. Are you sure it exists?'
    );
  }

  try {
    //-> Moving api directory to backend project
    copyRecursiveSync('config/backend/api', `${backendPath}/src/api`);
  } catch (error) {
    console.error(
      'An error occurred when moving the config/backend/api directory to the backend project. Are you sure it exists?'
    );
  }
  try {
    //-> Moving components directory to backend project
    copyRecursiveSync(
      'config/backend/components',
      `${backendPath}/src/components`
    );
  } catch (error) {
    console.error(
      'An error occurred when moving the config/backend/components directory to the backend project. Are you sure it exists?'
    );
  }
  try {
    //-> Moving env directory to backend project
    copyRecursiveSync('config/backend/env', `${backendPath}/src/env`);
  } catch (error) {
    // No environment configuration specified for backend project. Skipping...
  }
  // Finished installing backend
}