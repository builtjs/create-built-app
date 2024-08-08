import createEntry from '../create-entry';
import * as fileUtils from '../file-utils';

export default async function importEntryData(client:any, entries:any) {
  if (!entries) {
    return;
  }
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const files = await fileUtils.getFilesData(entry.files);
    await createEntry(client, entry.data, files);
  }
}
