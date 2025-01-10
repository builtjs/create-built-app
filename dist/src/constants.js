"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Constants = void 0;
var Constants;
(function (Constants) {
    Constants.API_URL = 'http://localhost'; //'https://api.builtjs.com';
    Constants.CURRENT_API_VERSION = '1.2';
    Constants.defaults = {
        LANGUAGE: 'typescript',
        EXT: 'ts',
    };
    Constants.TYPES = {
        site: 'site',
        theme: 'theme',
        plugin: 'plugin',
    };
    Constants.CMS = {
        sanity: 'sanity',
        strapi: 'strapi',
    };
    Constants.DEPS = {
        next: 'next',
        strapi: '@strapi/strapi',
        sanity: '@sanity/client',
    };
    Constants.CONFIG_PREFIX = 'config';
    Constants.SITE_FRONTEND_DIR = Constants.CONFIG_PREFIX;
    Constants.SITE_BACKEND_DIR = Constants.CONFIG_PREFIX + '/backend';
    Constants.THEME_PUBLIC_DIR = Constants.CONFIG_PREFIX + '/public';
    Constants.THEME_PAGES_DIR = Constants.CONFIG_PREFIX + '/pages';
    Constants.THEME_STYLES_DIR = Constants.CONFIG_PREFIX + '/styles';
    Constants.THEME_HOOKS_DIR = Constants.CONFIG_PREFIX + '/hooks';
    Constants.THEME_COMPONENTS_DIR = Constants.CONFIG_PREFIX + '/components';
    Constants.THEME_LIB_DIR = Constants.CONFIG_PREFIX + '/lib';
    Constants.errorMessages = {
        CANNOT_PROCEED: 'Unable to proceed with installation.',
        FRONTEND_NOT_FOUND: 'Frontend directory not found.',
        BACKEND_NOT_FOUND: 'Backend directory not found.',
        PUBLIC_NOT_FOUND: 'Directory "public" not found.',
        COMPONENTS_NOT_FOUND: 'Directory "components" not found.',
        PAGES_NOT_FOUND: 'Directory "pages" not found.',
        LIB_NOT_FOUND: 'Directory "lib" not found.',
    };
})(Constants || (exports.Constants = Constants = {}));
