"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createPage;
const fs_1 = require("fs");
/**
 * Create a page and attach files if there are any
 */
async function createPage(section, client, data, files) {
    try {
        if (files) {
            for (const [index, [key, fileOrFiles]] of Object.entries(files).entries()) {
                const [, contentSectionIndex, name] = key.split('.');
                // Handle both single file and array of files
                const fileArray = Array.isArray(fileOrFiles) ? fileOrFiles : [fileOrFiles];
                for (const file of fileArray) {
                    const filePath = file.path;
                    // Import image asset
                    const imageAsset = await client.assets.upload('image', (0, fs_1.createReadStream)(filePath));
                    let sectionWithFile = data.sections[parseInt(contentSectionIndex)];
                    if (sectionWithFile) {
                        const asset = {
                            "_type": "image",
                            "asset": {
                                "_ref": imageAsset._id,
                                "_type": "reference"
                            }
                        };
                        sectionWithFile[name] = asset;
                    }
                }
            }
        }
        try {
            const { _id, _type, ...rest } = data;
            const createdOrUpdatedDoc = await client.createOrReplace({
                _id,
                _type,
                ...rest,
            });
            console.log(`Created ${createdOrUpdatedDoc._id} page section: ${section._id}`);
        }
        catch (error) {
            console.error('Error creating or replacing document:', error);
        }
    }
    catch (e) {
        console.error('Error processing page:', e);
    }
}
