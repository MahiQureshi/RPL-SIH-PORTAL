import { offlineStorage } from './indexedDB';
import { apiRequest } from './api';

class SyncManager {
  constructor() {
    this.isSyncing = false;
    this.listeners = new Set();
    this.init();
  }

  init() {
    window.addEventListener('online', () => {
      console.log('[SyncManager] Online detected. Starting sync queue flush...');
      this.flushQueue();
    });
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify(event) {
    this.listeners.forEach((fn) => {
      try {
        fn(event);
      } catch (e) {
        console.error('[SyncManager] Error in listener:', e);
      }
    });
  }

  async flushQueue() {
    if (!navigator.onLine || this.isSyncing) return;

    this.isSyncing = true;
    this.notify({ type: 'SYNC_START' });

    try {
      const pending = await offlineStorage.getPendingOperations();
      console.log(`[SyncManager] Found ${pending.length} pending operations.`);

      for (const op of pending) {
        try {
          await apiRequest(op.endpoint, {
            method: op.method || 'POST',
            body: JSON.stringify(op.payload),
            headers: op.idempotencyKey ? { 'X-Idempotency-Key': op.idempotencyKey } : {},
          });
          await offlineStorage.markOperationSynced(op.id);
          this.notify({ type: 'ITEM_SYNCED', operation: op });
        } catch (err) {
          console.error(`[SyncManager] Sync failed for op ${op.id}:`, err);
          await offlineStorage.markOperationFailed(op.id, err.message);
        }
      }
    } catch (err) {
      console.error('[SyncManager] Sync queue error:', err);
    } finally {
      this.isSyncing = false;
      this.notify({ type: 'SYNC_END' });
    }
  }
}

export const syncManager = new SyncManager();
