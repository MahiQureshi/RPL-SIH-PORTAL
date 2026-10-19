/**
 * IndexedDB Local Storage Wrapper for RPL Platform
 * Provides persistent offline storage for declarations, scores, and offline sync queue.
 */

const DB_NAME = 'rpl_sih_offline_db';
const DB_VERSION = 1;

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      // Store 1: Local Drafts (declarations, notes)
      if (!db.objectStoreNames.contains('drafts')) {
        db.createObjectStore('drafts', { keyPath: 'key' });
      }

      // Store 2: Cached Assessments (for offline field evaluation)
      if (!db.objectStoreNames.contains('cached_assessments')) {
        db.createObjectStore('cached_assessments', { keyPath: 'id' });
      }

      // Store 3: Outbox Sync Queue (pending operations to send when online)
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        queueStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export const offlineStorage = {
  // Drafts
  async saveDraft(key, data) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      store.put({ key, data, updatedAt: new Date().toISOString() });
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getDraft(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readonly');
      const store = tx.objectStore('drafts');
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => reject(req.error);
    });
  },

  async clearDraft(key) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('drafts', 'readwrite');
      const store = tx.objectStore('drafts');
      store.delete(key);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  // Cached Assessments
  async cacheAssessment(assessment) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_assessments', 'readwrite');
      const store = tx.objectStore('cached_assessments');
      store.put(assessment);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getCachedAssessment(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_assessments', 'readonly');
      const store = tx.objectStore('cached_assessments');
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  },

  // Sync Queue
  async enqueueOperation(operation) {
    // operation: { type: 'RECORD_SCORE' | 'SAVE_DECLARATION', endpoint, method, payload, idempotencyKey }
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const item = {
        ...operation,
        status: 'PENDING',
        createdAt: new Date().toISOString(),
        retryCount: 0,
      };
      const req = store.add(item);
      req.onsuccess = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  },

  async getPendingOperations() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.getAll();
      req.onsuccess = () => {
        const pending = (req.result || []).filter((item) => item.status === 'PENDING');
        resolve(pending);
      };
      req.onerror = () => reject(req.error);
    });
  },

  async getAllQueueItems() {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  },

  async markOperationSynced(id) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          req.result.status = 'SYNCED';
          req.result.syncedAt = new Date().toISOString();
          store.put(req.result);
        }
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  },

  async markOperationFailed(id, errorMsg) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.get(id);
      req.onsuccess = () => {
        if (req.result) {
          req.result.status = 'FAILED';
          req.result.lastError = errorMsg;
          req.result.retryCount = (req.result.retryCount || 0) + 1;
          store.put(req.result);
        }
        resolve(true);
      };
      tx.onerror = () => reject(tx.error);
    });
  },
};
