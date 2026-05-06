"use client";

export type LobbyPreferences = {
  launchCount: number;
  lastPlayed: string | null;
  lastBackupAt: number | null;
  lastBackupReminderLaunchCount: number;
  storageToastShown: boolean;
  updatedAt: number;
};

const DB_NAME = "lobby_preferences";
const DB_VERSION = 1;
const STORE_NAME = "preferences";
const STATE_KEY = "state";

const defaultPreferences: LobbyPreferences = {
  launchCount: 0,
  lastPlayed: null,
  lastBackupAt: null,
  lastBackupReminderLaunchCount: 0,
  storageToastShown: false,
  updatedAt: 0,
};

function assertClient() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("Preferences are only available in the browser.");
  }
}

function openPreferencesDb() {
  assertClient();

  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readPreferences(): Promise<LobbyPreferences> {
  const db = await openPreferencesDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);

    request.onsuccess = () => {
      db.close();
      resolve({ ...defaultPreferences, ...(request.result as Partial<LobbyPreferences> | undefined) });
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function writePreferences(preferences: LobbyPreferences) {
  const db = await openPreferencesDb();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ ...preferences, updatedAt: Date.now() }, STATE_KEY);

    request.onsuccess = () => {
      db.close();
      resolve();
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function updatePreferences(updater: (preferences: LobbyPreferences) => LobbyPreferences) {
  const currentPreferences = await readPreferences();
  const nextPreferences = updater(currentPreferences);
  await writePreferences(nextPreferences);
  return nextPreferences;
}

export async function recordGameLaunch(gameId: string) {
  return updatePreferences((preferences) => ({
    ...preferences,
    launchCount: preferences.launchCount + 1,
    lastPlayed: gameId,
  }));
}

export { DB_NAME as PREFERENCES_DB_NAME };
