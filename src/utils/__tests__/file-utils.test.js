import { expect, test, vi } from 'vitest';
import { readDataFile, ensureDirectoryExists } from '../file-utils.js';
import fs from 'fs/promises';

vi.mock('fs/promises');

test('readDataFile reads and parses data.json correctly', async () => {
  const mockData = { pages: [] };
  fs.readFile.mockResolvedValue(JSON.stringify(mockData));
  
  const result = await readDataFile();
  expect(result).toEqual(mockData);
});

test('ensureDirectoryExists creates directory if it doesn\'t exist', async () => {
  fs.access.mockRejectedValue(new Error());
  await ensureDirectoryExists('test-dir');
  expect(fs.mkdir).toHaveBeenCalledWith('test-dir', { recursive: true });
});