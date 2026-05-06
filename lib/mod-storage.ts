"use client";

import { modRegistry } from "@/lib/mod-registry";

export type StoredModFile = {
  path: string;
  data: ArrayBuffer;
  type: string;
};

export type InstalledMod = {
  id: string;
  enabled: boolean;
  order: number;
  installedAt: number;
  version: string;
  files: StoredModFile[];
};

export type LovelyDumpState = {
  importedAt: number;
  fileName: string;
  files: StoredModFile[];
};

export type ModState = {
  installed: InstalledMod[];
  lovelyDump: LovelyDumpState | null;
  lastBuiltSignature: string | null;
  updatedAt: number;
};

const DB_NAME = "LobbyModDB";
const DB_VERSION = 1;
const STORE_NAME = "state";
const STATE_KEY = "balatro";
const MODDED_VERSION = "lobby-modded";

const defaultState: ModState = {
  installed: [],
  lovelyDump: null,
  lastBuiltSignature: null,
  updatedAt: 0,
};

function assertClient() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("Mod storage is only available in the browser.");
  }
}

function openModDb() {
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

export async function readModState(): Promise<ModState> {
  const db = await openModDb();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(STATE_KEY);

    request.onsuccess = () => {
      db.close();
      resolve({ ...defaultState, ...(request.result as Partial<ModState> | undefined) });
    };
    request.onerror = () => {
      db.close();
      reject(request.error);
    };
  });
}

export async function writeModState(state: ModState) {
  const db = await openModDb();

  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const request = store.put({ ...state, updatedAt: Date.now() }, STATE_KEY);

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

export function getEnabledMods(state: ModState) {
  return [...state.installed].filter((mod) => mod.enabled).sort((a, b) => a.order - b.order);
}

export function getModBuildSignature(state: ModState) {
  const enabled = getEnabledMods(state)
    .map((mod) => {
      const registryEntry = modRegistry.find((entry) => entry.id === mod.id);
      return `${mod.id}@${mod.version}:${registryEntry?.requiresLovelyDump ? "dump" : "plain"}`;
    })
    .join("|");

  const dumpSignature = state.lovelyDump ? `dump:${state.lovelyDump.importedAt}:${state.lovelyDump.files.length}` : "dump:none";

  return `${enabled}#${dumpSignature}`;
}

export function isRebuildNeeded(state: ModState) {
  return getModBuildSignature(state) !== state.lastBuiltSignature;
}

export function getActiveBalatroVersion(state: ModState) {
  const hasEnabledMods = getEnabledMods(state).length > 0;
  return hasEnabledMods && !isRebuildNeeded(state) ? MODDED_VERSION : "vanilla";
}

export { MODDED_VERSION };
