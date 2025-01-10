"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = createEntry;
const fs_1 = require("fs");
/**
 * Create an entry and attach files if there are any
 */
async function createEntry(client, data, files) {
    try {
        if (files) {
            for (const [key, item] of Object.entries(files)) {
                if (Array.isArray(item)) {
                    const assetArray = await Promise.all(item.map(async (file) => {
                        const filePath = file.path;
                        const imageAsset = await client.assets.upload('image', (0, fs_1.createReadStream)(filePath));
                        return {
                            _type: 'image',
                            asset: {
                                _ref: imageAsset._id,
                                _type: 'reference',
                            },
                        };
                    }));
                    data[key] = assetArray;
                }
                else {
                    const filePath = item.path;
                    const imageAsset = await client.assets.upload('image', (0, fs_1.createReadStream)(filePath));
                    const asset = {
                        _type: 'image',
                        asset: {
                            _ref: imageAsset._id,
                            _type: 'reference',
                        },
                    };
                    data[key] = asset;
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
            console.log('Entry created:', createdOrUpdatedDoc._id);
        }
        catch (error) {
            console.error('Error creating or replacing document:', error);
        }
    }
    catch (e) {
        console.log({ e });
    }
}
