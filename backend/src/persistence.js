import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createStore } from './store.js';

const persistedKeys = [
  'permissions',
  'roles',
  'users',
  'materialInbounds',
  'inventoryTransactions',
  'orders',
  'processRoutes',
  'processTasks',
  'auditLogs',
  'counters'
];

export function toPersistedData(targetStore) {
  return Object.fromEntries(persistedKeys.map((key) => [key, targetStore[key]]));
}

export async function saveStore(targetStore) {
  if (!targetStore.persistenceFile) {
    return;
  }
  await mkdir(dirname(targetStore.persistenceFile), { recursive: true });
  await writeFile(targetStore.persistenceFile, `${JSON.stringify(toPersistedData(targetStore), null, 2)}\n`, 'utf8');
}

export async function createPersistentStore(filePath) {
  let persistedData;
  try {
    persistedData = JSON.parse(await readFile(filePath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }

  const targetStore = createStore(persistedData);
  targetStore.persistenceFile = filePath;
  await saveStore(targetStore);
  return targetStore;
}
