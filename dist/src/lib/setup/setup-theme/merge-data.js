"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mergeData = mergeData;
function mergeArraysDistinct(arr1, arr2) {
    const merged = [...arr1];
    arr2.forEach(item2 => {
        const index = merged.findIndex(item1 => ((item1.name === item2.name) || (item1.slug && (item1.slug === item2.slug))));
        if (index === -1) {
            // No item with the same name exists in arr1, so push item2 directly
            merged.push(item2);
        }
        else {
            // Item with the same name exists, merge it
            const item1 = merged[index];
            // Check if namespaces are the same
            const namespace = item1.namespace === item2.namespace ? item1.namespace : undefined;
            // Merge objects, excluding namespace if they differ
            const { namespace: _, ...rest } = item2; // Exclude namespace from item2
            merged[index] = { ...item1, ...rest, namespace };
        }
    });
    return merged;
}
function mergeArrays(arr1, arr2) {
    // Concatenate both arrays and return the result
    return [...arr1, ...arr2];
}
function isNamedArray(value) {
    return (Array.isArray(value) &&
        value.every(item => item && typeof item.name === 'string'));
}
function mergeObjects(obj1, obj2) {
    const merged = { ...obj1 };
    for (const key in obj2) {
        if (Object.prototype.hasOwnProperty.call(obj2, key)) {
            if (typeof obj1[key] === 'object' &&
                obj1[key] !== null &&
                !Array.isArray(obj1[key])) {
                merged[key] = mergeObjects(obj1[key], obj2[key]);
            }
            else if (Array.isArray(obj1[key]) && isNamedArray(obj2[key])) {
                merged[key] = mergeArraysDistinct(obj1[key], obj2[key]);
            }
            else {
                merged[key] = obj2[key];
            }
        }
    }
    return merged;
}
function mergeData(data1, data2) {
    if (Object.keys(data2).length === 0) {
        return data1;
    }
    let data = {
        contentTypes: mergeArraysDistinct(data1.contentTypes, data2.contentTypes),
        pages: mergeArraysDistinct(data1.pages, data2.pages),
        sections: mergeArraysDistinct(data1.sections, data2.sections),
        templates: mergeArrays(data1.templates, data2.templates),
        layout: mergeObjects(data1.layout, data2.layout),
        collections: mergeObjects(data1.collections, data2.collections),
        plugins: data1.plugins || [],
    };
    if (data1.global && data2.global) {
        data.global = mergeObjects(data1.global, data2.global);
    }
    return data;
}
