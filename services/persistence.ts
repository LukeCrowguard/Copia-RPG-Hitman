
import { Mission, TeamLoadout, SimulationResult, Item } from '../types';
import { AudioTrack } from '../constants';

const DB_NAME = 'ICA_PLANNING_DB';
const STORE_NAME = 'app_state';
const DB_VERSION = 1;
const BACKUP_KEY = 'ICA_EMERGENCY_BACKUP';

export interface AppState {
  mission: Mission | null;
  loadout: TeamLoadout;
  result: SimulationResult | null;
  view: string;
  notes: string;
  mapImage: string | null;
  tracks: AudioTrack[];
  inventory: Item[];
  audioTabNames: Record<string, string>;
  lastUpdated?: number; // Timestamp for conflict resolution
}

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject('IndexedDB error');

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };
  });
};

export const saveState = async (state: AppState) => {
  const timestamp = Date.now();
  const stateWithTime = { ...state, lastUpdated: timestamp };

  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    
    // Serializable tracks for IDB (Store Blobs)
    const serializableTracks = state.tracks.map(t => ({
      id: t.id,
      name: t.name,
      category: t.category,
      blob: t.blob 
    }));

    const stateToSave = {
      ...stateWithTime,
      tracks: serializableTracks
    };

    store.put(stateToSave, 'current_session');
    
    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error("Failed to save state:", error);
  }
};

// SYNCHRONOUS backup for page unload events
export const saveEmergencyBackup = (state: AppState) => {
    try {
        const timestamp = Date.now();
        
        const backupState = {
            ...state,
            lastUpdated: timestamp,
            tracks: state.tracks.map(t => ({
                id: t.id,
                name: t.name,
                category: t.category
                // No blob, no url
            }))
        };

        try {
            localStorage.setItem(BACKUP_KEY, JSON.stringify(backupState));
        } catch (quotaError) {
            console.warn("Backup quota exceeded, trying stripped version");
            const strippedState = {
                ...backupState,
                mapImage: null,
                mission: state.mission ? { ...state.mission, imageUrl: undefined } : null
            };
            localStorage.setItem(BACKUP_KEY, JSON.stringify(strippedState));
        }
    } catch (e) {
        console.error("Emergency save failed", e);
    }
};

export const loadState = async (): Promise<AppState | null> => {
  let idbState: AppState | null = null;
  let lsState: AppState | null = null;

  // 1. Try Load from IndexedDB
  try {
    const db = await initDB();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.get('current_session');

    await new Promise<void>((resolve) => {
      request.onsuccess = () => {
        if (request.result) idbState = request.result;
        resolve();
      };
      request.onerror = () => resolve();
    });
  } catch (e) {
    console.error("IDB Load Error", e);
  }

  // 2. Try Load from LocalStorage Backup
  try {
      const rawBackup = localStorage.getItem(BACKUP_KEY);
      if (rawBackup) {
          lsState = JSON.parse(rawBackup);
      }
  } catch (e) {
      console.error("LS Load Error", e);
  }

  // 3. Merge Logic
  let finalState: AppState | null = null;

  if (idbState && lsState) {
      // Use the most recent one
      const idbTime = idbState.lastUpdated || 0;
      const lsTime = lsState.lastUpdated || 0;
      
      if (lsTime > idbTime) {
          console.log("Recovering from Emergency Backup (Newer)");
          finalState = { ...lsState };
          
          if (idbState.tracks && finalState.tracks) {
              finalState.tracks = finalState.tracks.map(lsTrack => {
                  const idbTrack = idbState!.tracks.find(t => t.id === lsTrack.id);
                  return idbTrack ? { ...lsTrack, blob: idbTrack.blob } : lsTrack;
              });
          }
      } else {
          finalState = idbState;
      }
  } else {
      finalState = idbState || lsState;
  }

  // 4. Hydrate URLs
  if (finalState && finalState.tracks) {
      finalState.tracks = finalState.tracks.map((t: any) => ({
          ...t,
          url: t.blob ? URL.createObjectURL(t.blob) : ''
      }));
  }

  return finalState;
};
