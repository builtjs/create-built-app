import * as fileUtils from '../file-utils';
import createPage from '../create-page';

interface FileData {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface PageSection {
  [key: string]: any;
}

interface PageData {
  _id: string;
  _type: string;
  sections: PageSection[];
  [key: string]: any;
}

interface Data {
  pages?: {
    data: PageData;
    files?: Record<string, string[]>;
  }[];
}

interface Files {
  [key: string]: FileData;
}

// Main function to import page data
export default async function importPageData(
  client: any,
  data: Data | null
): Promise<void> {
  if (!data?.pages) {
    return;
  }

  for (let i = 0; i < data.pages.length; i++) {
    const pageData = data.pages[i];
    if (!pageData) {
      continue;
    }
    for (let j = 0; j < pageData.data.sections.length; j++) {
      const section = pageData.data.sections[j];
      if (!section) {
        continue;
      }
      const pageFiles = await fileUtils.getFilesData(pageData.files?.page);
      const elementFiles = await fileUtils.getFilesData(
        pageData.files?.elements
      );
      const files = {...pageFiles, ...elementFiles};
      await createPage(section, client, pageData.data, files);
    }
  }
}
