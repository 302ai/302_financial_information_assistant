import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface IGraph {
    price: number;
    currency: number;
    date: string;
    volume: number;
}

export interface IChart {
    graph: IGraph[],
    summary: {
        title: string,
        stock: string,
        exchange: string,
        price: number,
        currency: string,
        date: string,
        price_change: {
            percentage: number,
            amount: number,
            movement: string
        }
    },
    search_metadata: {
        id: string,
        status: string,
        created_at: string,
        request_time_taken: number,
        parsing_time_taken: number,
        total_time_taken: number,
        request_url: string,
        html_url: string,
        json_url: string
    },
    code: string;
}

export interface IChartData {
    id?: number;
    data: IChart,
    type: 'search_on_google_finance' | 'search_on_google_news';
    sort: number;
}

const DB_NAME = 'ai-financial-information-assistant-chart-database';
const STORE_NAME = 'ai-financial-information-assistant-chart-store';


interface MyDB extends DBSchema {
    [STORE_NAME]: {
        key: number;
        value: IChartData
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

export async function addChartData(data: IChartData) {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const allRecords = await store.getAll();
    const maxSort = allRecords.length > 0
        ? Math.max(...allRecords.map(record => record.sort))
        : 0;

    const newData = {
        ...data,
        sort: maxSort + 1
    };

    const id = await store.add(newData);
    await tx.done;

    return { ...newData, id };
}

export async function getChartData(): Promise<IChartData[]> {
    const db = await getDB();
    const store = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME);
    const allRecords = await store.getAll();
    const sortList = allRecords.sort((a, b) => a.sort - b.sort)
    return allRecords;
}

export async function deleteChartData(id: number): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.objectStore(STORE_NAME).delete(id);
    await tx.done;
}

export async function clearAllChartData(): Promise<void> {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    await store.clear();
    await tx.done;
}

export async function updateChartData(id: number, data: Partial<IChartData>): Promise<IChartData | null> {
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

export async function updateChartSort(charts: IChartData[]) {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const promises = charts.map((chart, index) => {
        return store.put({
            ...chart,
            sort: index + 1  
        });
    });

    await Promise.all(promises);
    await tx.done;
}
