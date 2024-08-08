import createEntry from '../create-entry';
import * as fileUtils from '../file-utils';

interface File {
  url?: string;
  name: string;
  ext: string;
  path?: string;
  repoName: string;
}


interface FileData {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface GlobalData {
  files: Record<string, File | File[]>; // Ensure this type matches the expected input for getFilesData
  data: any; // Adjust the type based on the actual structure of 'global.data'
}

export default async function importGlobalData(client: any, global: GlobalData | null): Promise<void> {
  if (!global) {
    return;
  }
  const files = await fileUtils.getFilesData(global.files);
  
  await createEntry(client, global.data, files);
}
