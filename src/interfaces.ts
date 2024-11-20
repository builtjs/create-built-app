
export interface CombinedData {
    data: Record<string, any>;
    components: Record<string, string>;
    lib: Record<string, string>;
    styles: Record<string, string>;
    api: Record<string, string>;
    config: Record<string, string>;
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

  export type Page = {
    name: string;
    title: string;
    demoSections: DemoSection[];
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
    images: Record<string, string>;
    repoUrl: string;
    demoUrl: string;
  };

  export type Layout = {
    contentIndex: number;
    sections: DemoSection[];
  };