import { expect, test, vi } from 'vitest';
import { findNextPort } from '../port-utils.js';
import psList from 'ps-list';

vi.mock('ps-list');

test('findNextPort detects custom port from next dev -p flag', async () => {
  psList.mockResolvedValue([
    { cmd: 'node /usr/local/bin/next dev -p 4000', name: 'node' }
  ]);
  
  const port = await findNextPort();
  expect(port).toBe(4000);
});

test('findNextPort detects custom port from --port flag', async () => {
  psList.mockResolvedValue([
    { cmd: 'node /usr/local/bin/next dev --port 5000', name: 'node' }
  ]);
  
  const port = await findNextPort();
  expect(port).toBe(5000);
});

test('findNextPort returns default port when no port specified', async () => {
  psList.mockResolvedValue([
    { cmd: 'node /usr/local/bin/next dev', name: 'node' }
  ]);
  
  const port = await findNextPort();
  expect(port).toBe(3000);
});

test('findNextPort throws error when no Next.js process found', async () => {
  psList.mockResolvedValue([
    { cmd: 'some other process', name: 'other' }
  ]);
  
  await expect(findNextPort()).rejects.toThrow('No Next.js development server found');
});