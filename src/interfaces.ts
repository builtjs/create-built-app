
export interface CombinedData {
    data: Record<string, any>;
    components: Record<string, string>;
    lib: Record<string, string>;
    hooks: Record<string, string>;
    styles: Record<string, string>;
    api: Record<string, string>;
    config: Record<string, string>;
  }

  export interface ThemeOrPlugin {
    namespace: string;
    language?: string;
    plugins?: string[];
  }

  export type DemoSection = {
    name: string;
  };

  export interface BuiltData {
    sections: BuiltSection[];
    pages: Page[];
    contentTypes: ContentType[];
    layout: Layout;
    collections: {[key: string]: any};
    templates: Template[];
    global?: {[key: string]: any};
    theme?: {[key: string]: any};
    plugin?: {[key: string]: any};
    plugins: string[];
  }

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

  export type ModulePage = {
    name: string;
    description: string;
    page: {name: string};
    sections: Array<{
      name: string;
      position: string;
    }>;
  };


  export type Page = {
    name: string;
    title: string;
    demoSections: DemoSection[];
    contentType: ContentType;
    sections: Section[];
  };

  export interface BuiltSection {
    name: string;
    title: string;
    data: {[key: string]: any};
  }

  export interface ContentType {
    name: string;
    fields: {[key: string]: Field};
  }

  export interface Field {
    type: string;
    default?: string;
  }

  export type Template = {
    name: string;
    title: string;
    category: string;
    description: string;
    repoUrl: string;
    demoUrl: string;
    imageUrl: string;
  };

  export type Layout = {
    contentIndex: number;
    sections: DemoSection[];
  };

  export interface ModulePagesData {
    modulePages: ModulePage[];
  }

  export interface PagesData {
    pages: Page[];
  }
  
  export interface SectionsData {
    sections: Section[];
  }
  
  export interface TemplatesData {
    templates: Template[];
  }

  export interface CollectionData {
    data: Array<{
      _id: string;
      _type: string;
      [key: string]: any;
    }>;
  }