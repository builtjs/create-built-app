import * as fileUtils from '../file-utils';


export default async function importFileData(data: any): Promise<any> {
  const files = await fileUtils.getFilesData(data.files.page);
  return files;
}
