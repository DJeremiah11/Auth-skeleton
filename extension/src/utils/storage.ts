// Chrome Storage Wrapper for secure token storage

interface StorageData {
    accessToken?: string;
    refreshToken?: string;
    user?: any;
}

export const storage = {
    async get<K extends keyof StorageData>(key: K): Promise<StorageData[K] | null> {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => {
                resolve(result[key] || null);
            });
        });
    },

    async set<K extends keyof StorageData>(key: K, value: StorageData[K]): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: value }, () => {
                resolve();
            });
        });
    },

    async remove(key: keyof StorageData): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.remove(key, () => {
                resolve();
            });
        });
    },

    async clear(): Promise<void> {
        return new Promise((resolve) => {
            chrome.storage.local.clear(() => {
                resolve();
            });
        });
    },

    async getAll(): Promise<StorageData> {
        return new Promise((resolve) => {
            chrome.storage.local.get(null, (result) => {
                resolve(result as StorageData);
            });
        });
    }
};
