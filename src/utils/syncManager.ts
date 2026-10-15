/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Cymatic OS - Offline-First Synchronization Manager
 * Treats localStorage strictly as an offline cache and queue, automatically synchronizing
 * pending changes to Supabase when online.
 */

import { supabase } from './supabase';

interface SyncQueueItem {
  id: string;
  table: string;
  action: 'upsert' | 'delete';
  payload: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'cymatic_offline_sync_queue_v1';

export class SyncManager {
  private static isSyncing = false;

  public static initialize() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      console.log('[SyncManager] Connection restored. Flushing offline sync queue...');
      this.flushQueue();
    });

    // Attempt initial sync on load if online
    if (navigator.onLine) {
      this.flushQueue();
    }
  }

  public static enqueueChange(table: string, action: 'upsert' | 'delete', payload: any) {
    try {
      const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      const item: SyncQueueItem = {
        id: `${table}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        table,
        action,
        payload,
        timestamp: Date.now()
      };
      queue.push(item);
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

      // Try flushing immediately if online
      if (navigator.onLine) {
        this.flushQueue();
      }
    } catch (e) {
      console.warn('[SyncManager] Failed to enqueue change:', e);
    }
  }

  public static async flushQueue(): Promise<void> {
    if (this.isSyncing || !navigator.onLine) return;
    this.isSyncing = true;

    try {
      const queue: SyncQueueItem[] = JSON.parse(localStorage.getItem(SYNC_QUEUE_KEY) || '[]');
      if (queue.length === 0) {
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncManager] Syncing ${queue.length} offline changes to Supabase...`);

      const remaining: SyncQueueItem[] = [];

      for (const item of queue) {
        try {
          if (item.action === 'upsert') {
            const { error } = await supabase
              .from(item.table)
              .upsert(item.payload);
            if (error) {
              console.warn(`[SyncManager] Upsert failed for table ${item.table}:`, error);
              remaining.push(item);
            }
          } else if (item.action === 'delete') {
            const { error } = await supabase
              .from(item.table)
              .delete()
              .eq('id', item.payload.id);
            if (error) {
              console.warn(`[SyncManager] Delete failed for table ${item.table}:`, error);
              remaining.push(item);
            }
          }
        } catch (err) {
          console.warn(`[SyncManager] Error processing queue item ${item.id}:`, err);
          remaining.push(item);
        }
      }

      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(remaining));
      if (remaining.length === 0) {
        console.log('[SyncManager] All offline changes successfully synchronized.');
      }
    } catch (e) {
      console.error('[SyncManager] Flush queue error:', e);
    } finally {
      this.isSyncing = false;
    }
  }
}
