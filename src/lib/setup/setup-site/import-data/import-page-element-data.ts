import { createReadStream } from 'fs';
import * as fileUtils from '../file-utils';

interface File {
  url: string;
  name: string;
  ext: string;
  path: string;
  repoName: string;
}

interface FileData {
  path: string;
  name: string;
  size: number;
  type: string;
}

interface PageData {
  data: {
    sections: Record<string, any>[]; // Adjust the type based on the actual structure of 'sections'
    [key: string]: any; // Adjust as needed for other properties
  };
  files?: {
    elements?: Record<string, any>; // Adjust this type as needed
  };
}

interface ElementData {
  _id: string;
  [key: string]: any; // Adjust this type based on the actual structure of 'elementData'
}

interface ElementsData {
  data: ElementData[];
}

interface Section {
  [key: string]: any; // Adjust this type based on the actual structure of 'section'
}

export default async function importPageElementData(client: any, data: { pages?: PageData[]; elements?: ElementsData }): Promise<void> {
  if (!data.pages || !data.elements) {
    return;
  }

  for (const [index, pageData] of data.pages.entries()) {
    // Loop sections
    if (pageData.data?.sections) {
      for (const [sectionIndex, section] of pageData.data.sections.entries()) {
        pageData.data.sections[sectionIndex] = await uploadElementFiles(
          section,
          pageData,
          data.elements,
          sectionIndex,
          client
        );
      }
    }
  }
}

async function uploadElementFiles(
  section: Section,
  pageData: PageData,
  elementsData: ElementsData,
  index: number,
  client: any
): Promise<Section> {
  for (const prop in section) {
    if (Object.prototype.hasOwnProperty.call(section, prop)) {
      
      const attributeName = `contentSections.${index}.${prop}`;
      if (pageData.files?.elements?.[attributeName]) {
        const elementRef = section[prop];
        for (const fileProp in pageData.files.elements[attributeName]) {
          if (Object.prototype.hasOwnProperty.call(pageData.files.elements[attributeName], fileProp)) {
            let fileData = pageData.files.elements[attributeName][fileProp];
            if (!Array.isArray(fileData)) {
              fileData = [fileData];
            }
            
            // Convert array to record format
            const fileRecord: Record<string, File | File[]> = { [fileProp]: fileData };
            const files = await fileUtils.getFilesData(fileRecord);
            if (files) {
              for (const [, fileArray] of Object.entries(files)) {
                for (const file of fileArray as FileData[]) {
                  const filePath = file.path;
                  // Import image asset
                  const imageAsset = await client.assets.upload(
                    'image',
                    createReadStream(filePath)
                  );
                  const asset = {
                    _type: 'image',
                    asset: {
                      _ref: imageAsset._id,
                      _type: 'reference',
                    },
                  };
                  if (Array.isArray(elementRef)) {
                    const ref = elementRef[index];
                    setElement(elementsData, ref, prop, asset);
                  } else {
                    setElement(elementsData, elementRef, prop, asset);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  return section;
}

function setElement(elementsData: ElementsData, ref: { _ref: string }, prop: string, asset: any): void {
  for (const elementData of elementsData.data) {
    if (elementData._id === ref._ref) {
      elementData[prop] = asset;
      break;
    }
  }
}
