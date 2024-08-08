export type FieldType = {
  type: string;
  targetField?: string;
  required?: boolean;
  unique?: boolean;
};

export type ContentType = {
  name: string;
  title: string;
  fields: Record<string, FieldType>;
};

type DemoSection = {
  name: string;
};

export type Page = {
  name: string;
  title: string;
  demoSections: DemoSection[];
};

export type Section = {
  name: string;
  title: string;
  description: string;
  templates: string[];
  defaultTemplate: {name: string};
  data: Record<string, string>;
  collections: Record<string, any>;
  position: number;
  namespace: string;
};

export type Template = {
  name: string;
  title: string;
  category: string;
  description: string;
  images: Record<string, string>;
  repoUrl: string;
  demoUrl: string;
};

export type Layout = {
  contentIndex: number;
  sections: DemoSection[];
};

export type Global = {};

export type Collection = {
  [key: string]: any[];
};

export type Data = {
  contentTypes: ContentType[];
  pages: Page[];
  sections: Section[];
  templates: Template[];
  layout: Layout;
  global: Global;
  collections: Collection;
};

function mergeArrays<T extends {name: string}>(
  arr1: T[],
  arr2: T[]
): T[] {
  const merged = [...arr1];
  arr2.forEach(item2 => {
    const index = merged.findIndex(item1 => item1.name === item2.name);
    if (index === -1) {
      merged.push(item2);
    } else {
      merged[index] = {...merged[index], ...item2};
    }
  });
  return merged;
}

function isNamedArray<T>(value: any): value is T[] {
  return (
    Array.isArray(value) &&
    value.every(item => item && typeof item.name === 'string')
  );
}

function mergeObjects<T extends Record<string, any>>(obj1: T, obj2: T): T {
  const merged: any = {...obj1};
  for (const key in obj2) {
    if (Object.prototype.hasOwnProperty.call(obj2, key)) {
      if (
        typeof obj1[key] === 'object' &&
        obj1[key] !== null &&
        !Array.isArray(obj1[key])
      ) {
        merged[key] = mergeObjects(obj1[key], obj2[key]);
      } else if (Array.isArray(obj1[key]) && isNamedArray(obj2[key])) {
        merged[key] = mergeArrays(obj1[key], obj2[key] as any);
      } else {
        merged[key] = obj2[key];
      }
    }
  }

  return merged;
}

export function mergeData(data1: Data, data2: Data): Data {
  if (Object.keys(data2).length === 0) {
    return data1;
  }
  return {
    contentTypes: mergeArrays(data1.contentTypes, data2.contentTypes),
    pages: mergeArrays(data1.pages, data2.pages),
    sections: mergeArrays(data1.sections, data2.sections),
    templates: mergeArrays(data1.templates, data2.templates),
    layout: mergeObjects<Layout>(data1.layout, data2.layout),
    global: mergeObjects<Global>(data1.global, data2.global),
    collections: mergeObjects<Collection>(data1.collections, data2.collections),
  };
}
