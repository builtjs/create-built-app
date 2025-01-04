import { CreateCommandOptions } from '../types';

export function validateCreateOptions(options: CreateCommandOptions): void {
  if (options.designSystem && !['basic', 'shadcn'].includes(options.designSystem)) {
    throw new Error('Design system must be either "basic" or "shadcn"');
  }
}