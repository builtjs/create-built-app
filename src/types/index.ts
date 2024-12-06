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