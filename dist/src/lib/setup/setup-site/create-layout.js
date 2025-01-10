"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createLayout;
const fs_1 = require("fs");
/**
 * Create a layout and attach files if there are any
 */
async function createLayout(client, layout, files) {
    try {
        if (files && Object.keys(files).length > 0) {
            for (const [key, fileOrArray] of Object.entries(files)) {
                const [, contentSectionIndex, name] = key.split('.');
                const sectionIndex = parseInt(contentSectionIndex, 10);
                const section = layout.sections[sectionIndex];
                if (section) {
                    if (Array.isArray(fileOrArray)) {
                        for (const file of fileOrArray) {
                            const filePath = file.path;
                            // Import image asset
                            const imageAsset = await client.assets.upload('image', (0, fs_1.createReadStream)(filePath));
                            const asset = {
                                _type: 'image',
                                asset: {
                                    _ref: imageAsset._id,
                                    _type: 'reference',
                                },
                            };
                            section[name] = asset;
                        }
                    }
                    else {
                        const filePath = fileOrArray.path;
                        // Import image asset
                        const imageAsset = await client.assets.upload('image', (0, fs_1.createReadStream)(filePath));
                        const asset = {
                            _type: 'image',
                            asset: {
                                _ref: imageAsset._id,
                                _type: 'reference',
                            },
                        };
                        section[name] = asset;
                    }
                }
            }
        }
        for (const section of layout.sections) {
            try {
                await client.createOrReplace(section);
            }
            catch (error) {
                console.error('Error creating or replacing document:', error);
            }
        }
    }
    catch (e) {
        console.error('Error processing layout:', e);
    }
}
