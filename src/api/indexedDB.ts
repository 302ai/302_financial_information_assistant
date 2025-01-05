import { openDB, DBSchema, IDBPDatabase } from 'idb';

export interface INews {
  date: string;
  favicon: string;
  link: string;
  position: string;
  snippet: string;
  spurce: string;
  thumbnail: string;
  title: string;
}

export interface IChat {
  id?: number;
  uid: string;
  askText: string;
  created_at: string;
  role: 'user' | 'assistant';
  newsData: INews[];
  status?: 'perform' | 'done';
}

const DB_NAME = 'ai-financial-information-assistant-chat-database';
const STORE_NAME = 'ai-financial-information-assistant-chat-store';

interface MyDB extends DBSchema {
  [STORE_NAME]: {
    key: number;
    value: IChat
  };
}

export async function initDB(): Promise<IDBPDatabase<MyDB>> {
  const db = await openDB<MyDB>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    },
  });
  return db;
}
let db: IDBPDatabase<MyDB> | null = null;

async function getDB(): Promise<IDBPDatabase<MyDB>> {
  if (!db) {
    db = await initDB();
  }
  return db;
}

export async function addChatData(data: IChat) {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const id = await store.add(data);
  await tx.done;
  return { ...data, id };
}

export async function getChatData(): Promise<IChat[]> {
  const db = await getDB();
  const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
  const allRecords = await store.getAll();
  return allRecords;
}

export async function deleteChatData(id: number): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  await tx.objectStore(STORE_NAME).delete(id);
  await tx.done;
}

export async function clearAllChatData(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  await store.clear();
  await tx.done;
}

export async function updateChatData(id: number, data: Partial<IChat>): Promise<IChat | null> {
  const db = await getDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  const existingData = await store.get(id);

  if (!existingData) {
    await tx.done;
    return null;
  }
  const updatedData = { ...existingData, ...data };

  await store.put(updatedData);
  await tx.done;
  return updatedData;
}