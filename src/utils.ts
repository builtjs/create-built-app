import * as fs from 'fs';
import * as path from 'path';
/**
 * Recursively copy into new destination.
 * @param {string} src  The path to the thing to copy.
 * @param {string} dest The path to the new copy.
 */
export function copyRecursiveSync(src: string, dest: string) {
  var exists = exports.exists(src);
  var stats: any = exists && fs.statSync(src);
  var isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    fs.mkdirSync(dest, {recursive: true});
    fs.readdirSync(src).forEach(function (childItemName) {
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

export function exists(src: string) {
  return fs.existsSync(src);
}

export function getSrcDir(): string {
  const dirs = [
    path.join(process.cwd(), 'src'),
    process.cwd()
  ];
  let directory: string = '';
  for (const dir of dirs) {
    if (fs.existsSync(dir)) {
      directory = dir;
      break;
    }
  }
  return directory;
}

