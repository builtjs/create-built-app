import * as fs from 'fs';
import * as path from 'path';
/**
 * Look ma, it's cp -R.
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
