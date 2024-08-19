import 'dotenv/config';
import { createClient } from 'next-sanity';
import importPageData from './import-page-data';
import importEntryData from './import-entry-data';
import importLayoutData from './import-layout-data';
import importGlobalData from './import-global-data';
import importPageElementData from './import-page-element-data';
import importElementData from './import-element-data';
import * as path from 'path';
import { promises as fs } from 'fs';

const dataPath = path.join(process.cwd(), 'setup/data.json');

const getEnvVariable = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    console.error(`Error: Missing environment variable ${key}`);
    process.exit(1); // Exit if the required environment variable is not found
  }
  return value;
};

export async function setupSiteData(): Promise<void> {
  console.info('Seeding data into Sanity...');

  let client;
  try {
    const sanityProjectId = getEnvVariable('NEXT_PUBLIC_SANITY_PROJECT_ID');
    const sanityDataset = getEnvVariable('NEXT_PUBLIC_SANITY_DATASET');
    const sanityWriteToken = getEnvVariable('NEXT_PUBLIC_SANITY_WRITE_TOKEN');
    const sanityApiVersion = getEnvVariable('NEXT_PUBLIC_SANITY_API_VERSION');
    
    client = createClient({
      projectId: sanityProjectId,
      dataset: sanityDataset,
      token: sanityWriteToken,
      useCdn: false,
      apiVersion: sanityApiVersion
    });
  } catch (error) {
    console.error(`Failed to load environment variables: ${(error as Error).message}`);
    process.exit(1);
  }

  try {
    const data = JSON.parse(await fs.readFile(dataPath, 'utf8'));

    await importGlobalData(client, data.global);
    console.log('Global data import complete');

    await importElementData(client, data.elements);
    console.log('Element data import complete');

    await importLayoutData(client, data.layout);
    console.log('Layout data import complete');

    await importPageElementData(client, data);
    console.log('Page element data import complete');

    await importPageData(client, data);
    console.log('Page data import complete');

    await importEntryData(client, data.entries);
    console.log('Done!');
    process.exit(1);
  } catch (error) {
    console.error('Error importing data:', error);
  }
}
