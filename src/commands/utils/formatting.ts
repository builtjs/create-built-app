import camelcase from 'camelcase';
import kebabCase from 'kebab-case';

export function toCamelCase(str: string): string {
  return camelcase(str);
}

export function toKebabCase(str: string): string {
    return kebabCase(str);
}

export function formatComponentName(baseName: string): {
  componentName: string;  // camelCase for the template name
  fileName: string;       // kebab-case for the file name
} {
  const timestamp = Date.now();
  const componentName = toCamelCase(`${baseName}${timestamp}`);
  const fileName = toKebabCase(componentName);
  
  return { componentName, fileName };
}