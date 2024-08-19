import createLayout from '../create-layout';
import * as fileUtils from '../file-utils';
interface File {
  url?: string;
  name: string;
  ext: string;
  path?: string;
  repoName: string;
}

interface LayoutData {
  files: Record<string, File | File[]>;
  data: any;
}
export default async function importLayoutData(client: any, layout: LayoutData) {
  if (!layout || !layout.data || !layout.data.sections) {
    return;
  }
  const pageFiles = await fileUtils.getFilesData(layout.files.page);
  const elementFiles = await fileUtils.getFilesData(layout.files.elements);
  const files = {...pageFiles, ...elementFiles};
  await createLayout(client, layout.data, files);
}