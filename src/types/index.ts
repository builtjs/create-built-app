export interface Page {
  name: string;
  sections: Section[];
}

export interface Section {
  name: string;
}

export interface ProjectData {
  pages: Page[];
}

export interface CreateCommandOptions {
  section?: string;
  prompt?: string;
  designSystem?: 'basic' | 'shadcn';
}

export interface OpenAIConfig {
  apiKey: string;
  model: string;
}

export interface TemplateMetadata {
  name: string;
  category: string;
  title: string;
  description: string;
  code: string;
}

export type TemplateCategory = 
  | "articles"
  | "banners"
  | "blocks"
  | "cards"
  | "covers"
  | "footers"
  | "forms"
  | "head"
  | "headers"
  | "lists";