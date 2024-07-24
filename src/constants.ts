export namespace Constants {
  export const API_URL = 'http://localhost';
  export const CURRENT_API_VERSION = '1.2';
  export const defaults = {
    LANGUAGE: 'typescript',
    EXT: 'ts'
  }
  export const TYPES = {
    site: 'site',
    theme: 'theme',
    plugin: 'plugin'
  };

  export const CMS = {
    sanity: 'sanity',
    strapi: 'strapi'
  };

  export const DEPS = {
    next: 'next',
    strapi: '@strapi/strapi',
    sanity: '@sanity/client'
  };
    export const CONFIG_PREFIX = 'config';
    export const SITE_FRONTEND_DIR = CONFIG_PREFIX;
    export const SITE_BACKEND_DIR = CONFIG_PREFIX + '/backend';
    export const THEME_PUBLIC_DIR = CONFIG_PREFIX + '/public';
    export const THEME_PAGES_DIR = CONFIG_PREFIX + '/pages';
    export const THEME_STYLES_DIR = CONFIG_PREFIX + '/styles';
    export const THEME_COMPONENTS_DIR = CONFIG_PREFIX + '/components';
    export const THEME_LIB_DIR = CONFIG_PREFIX + '/lib';
    export const errorMessages = {
      CANNOT_PROCEED: 'Unable to proceed with installation.',
      FRONTEND_NOT_FOUND: 'Frontend directory not found.',
      BACKEND_NOT_FOUND: 'Backend directory not found.',
      PUBLIC_NOT_FOUND: 'Directory "public" not found.',
      COMPONENTS_NOT_FOUND: 'Directory "components" not found.',
      PAGES_NOT_FOUND: 'Directory "pages" not found.',
      LIB_NOT_FOUND: 'Directory "lib" not found.',
    }
  }