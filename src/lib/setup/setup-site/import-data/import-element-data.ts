import createEntry from "../create-entry";
import * as fileUtils from "../file-utils";

interface Element {
  _id: string;
  files?: Record<string, any>; // Adjust as needed
  [key: string]: any;
}

interface ElementsData {
  data: Element[];
}

export default async function importElementData(client: any, elements: ElementsData): Promise<void> {
  if (!elements || !elements.data) {
    return;
  }
  for (const element of elements.data) {
    let files;
    if (element.files) {
      files = await fileUtils.getFilesData(element.files);
    }
    await createEntry(client, element.data, files);
  }
}
