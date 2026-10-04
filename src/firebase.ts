/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Resilient Offline-First Firebase & Firestore Engine
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase App instance safely across re-renders
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Modern Offline Persistence Engine setup
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

// Configure Auth with hardened local browser persistence
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch((err) => {
  console.warn('[Firebase Engine] Auth local persistence setup warning:', err);
});

export default app;
