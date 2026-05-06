"use client";

import JSZip from "jszip";

type EncodedValue =
  | null
  | string
  | number
  | boolean
  | { __type: "undefined" }
  | { __type: "date"; value: string }
  | { __type: "blob"; type: string; data: string }
  | { __type: "arrayBuffer"; data: string }
  | { __type: "typedArray"; name: string; data: string }
  | EncodedValue[]
  | { [key: string]: EncodedValue };

type BackupRecord = {
  key: EncodedValue;
  value: EncodedValue;
};

type BackupStore = {
  name: string;
  keyPath: string | string[] | null;
  autoIncrement: boolean;
  records: BackupRecord[];
};

type BackupDatabase = {
  name: string;
  version: number;
  stores: BackupStore[];
};

type BackupManifest = {
  app: "Lobby";
  version: 1;
  createdAt: string;
  databases: BackupDatabase[];
  notes: string[];
};

type IndexedDbFactoryWithDatabases = IDBFactory & {
  databases?: () => Promise<Array<{ name?: string | null; version?: number }>>;
};

const KNOWN_DATABASES = [
  "BalatroCacheDB",
  "Balatro_vanilla_/home/web_user/love",
  "Balatro_lobby-modded_/home/web_user/love",
  "lobby_installed_mods",
  "lobby_preferences",
  "LobbyModDB",
];

function assertClient() {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    throw new Error("Backups are only available in the browser.");
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let index = 0; index < bytes.byteLength; index += 1) {
    binary += String.fromCharCode(bytes[index]);
  }

  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string) {
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes.buffer;
}

async function encodeValue(value: unknown): Promise<EncodedValue> {
  if (value === undefined) {
    return { __type: "undefined" };
  }

  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (value instanceof Date) {
    return { __type: "date", value: value.toISOString() };
  }

  if (value instanceof Blob) {
    return {
      __type: "blob",
      type: value.type,
      data: arrayBufferToBase64(await value.arrayBuffer()),
    };
  }

  if (value instanceof ArrayBuffer) {
    return { __type: "arrayBuffer", data: arrayBufferToBase64(value) };
  }

  if (ArrayBuffer.isView(value)) {
    return {
      __type: "typedArray",
      name: value.constructor.name,
      data: arrayBufferToBase64(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength)),
    };
  }

  if (Array.isArray(value)) {
    return Promise.all(value.map((item) => encodeValue(item)));
  }

  if (typeof value === "object") {
    const encoded: { [key: string]: EncodedValue } = {};

    for (const [key, entryValue] of Object.entries(value)) {
      encoded[key] = await encodeValue(entryValue);
    }

    return encoded;
  }

  return String(value);
}

function decodeValue(value: EncodedValue): unknown {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => decodeValue(item));
  }

  if ("__type" in value) {
    if (value.__type === "undefined") {
      return undefined;
    }

    if (value.__type === "date") {
      return new Date(value.value);
    }

    if (value.__type === "blob") {
      return new Blob([base64ToArrayBuffer(value.data)], { type: value.type });
    }

    if (value.__type === "arrayBuffer") {
      return base64ToArrayBuffer(value.data);
    }

    if (value.__type === "typedArray") {
      return new Uint8Array(base64ToArrayBuffer(value.data));
    }
  }

  const decoded: Record<string, unknown> = {};

  for (const [key, entryValue] of Object.entries(value)) {
    decoded[key] = decodeValue(entryValue);
  }

  return decoded;
}

function openDatabase(name: string) {
  return new Promise<IDBDatabase | null>((resolve, reject) => {
    const request = indexedDB.open(name);
    let created = false;

    request.onupgradeneeded = () => {
      created = true;
    };
    request.onsuccess = () => {
      const db = request.result;

      if (created && db.objectStoreNames.length === 0) {
        db.close();
        indexedDB.deleteDatabase(name);
        resolve(null);
        return;
      }

      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

async function listRelevantDatabases() {
  const factory = indexedDB as IndexedDbFactoryWithDatabases;
  const names = new Set<string>(KNOWN_DATABASES);

  if (factory.databases) {
    const databases = await factory.databases();

    for (const database of databases) {
      const name = database.name;

      if (!name) {
        continue;
      }

      if (
        name === "BalatroCacheDB" ||
        name === "lobby_installed_mods" ||
        name === "lobby_preferences" ||
        name === "LobbyModDB" ||
        name.startsWith("Balatro_")
      ) {
        names.add(name);
      }
    }
  }

  return [...names];
}

async function exportStore(db: IDBDatabase, storeName: string): Promise<BackupStore> {
  const tx = db.transaction(storeName, "readonly");
  const store = tx.objectStore(storeName);
  const records: BackupRecord[] = [];

  await new Promise<void>((resolve, reject) => {
    const cursor = store.openCursor();

    cursor.onsuccess = async () => {
      const result = cursor.result;

      if (!result) {
        resolve();
        return;
      }

      records.push({
        key: await encodeValue(result.key),
        value: await encodeValue(result.value),
      });
      result.continue();
    };
    cursor.onerror = () => reject(cursor.error);
  });

  return {
    name: store.name,
    keyPath: store.keyPath,
    autoIncrement: store.autoIncrement,
    records,
  };
}

async function exportDatabase(name: string): Promise<BackupDatabase | null> {
  const db = await openDatabase(name);

  if (!db) {
    return null;
  }

  try {
    const stores: BackupStore[] = [];

    for (const storeName of Array.from(db.objectStoreNames)) {
      stores.push(await exportStore(db, storeName));
    }

    if (stores.length === 0) {
      return null;
    }

    return {
      name: db.name,
      version: db.version || 1,
      stores,
    };
  } finally {
    db.close();
  }
}

function deleteDatabase(name: string) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase(name);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error(`Close other Lobby tabs before restoring ${name}.`));
  });
}

function restoreDatabase(database: BackupDatabase) {
  return new Promise<void>((resolve, reject) => {
    const request = indexedDB.open(database.name, Math.max(database.version, 1));

    request.onupgradeneeded = () => {
      const db = request.result;

      for (const store of database.stores) {
        if (!db.objectStoreNames.contains(store.name)) {
          db.createObjectStore(store.name, {
            keyPath: store.keyPath ?? undefined,
            autoIncrement: store.autoIncrement,
          });
        }
      }
    };

    request.onsuccess = async () => {
      const db = request.result;

      try {
        for (const store of database.stores) {
          const tx = db.transaction(store.name, "readwrite");
          const objectStore = tx.objectStore(store.name);

          objectStore.clear();

          for (const record of store.records) {
            const key = decodeValue(record.key) as IDBValidKey;
            const restoredValue = decodeValue(record.value);

            if (store.keyPath === null) {
              objectStore.put(restoredValue, key);
            } else {
              objectStore.put(restoredValue);
            }
          }

          await new Promise<void>((resolveTx, rejectTx) => {
            tx.oncomplete = () => resolveTx();
            tx.onerror = () => rejectTx(tx.error);
            tx.onabort = () => rejectTx(tx.error);
          });
        }

        db.close();
        resolve();
      } catch (error) {
        db.close();
        reject(error);
      }
    };
    request.onerror = () => reject(request.error);
  });
}

export async function exportLobbyBackup() {
  assertClient();

  const databaseNames = await listRelevantDatabases();
  const databases = (await Promise.all(databaseNames.map((name) => exportDatabase(name)))).filter(
    (database): database is BackupDatabase => Boolean(database),
  );

  const manifest: BackupManifest = {
    app: "Lobby",
    version: 1,
    createdAt: new Date().toISOString(),
    databases,
    notes: [
      "Includes BalatroCacheDB built versions, Balatro_* save databases, lobby_installed_mods, and lobby_preferences when present.",
    ],
  };
  const zip = new JSZip();
  zip.file("manifest.json", JSON.stringify(manifest, null, 2));

  const blob = await zip.generateAsync({ type: "blob" });
  const date = new Date().toISOString().slice(0, 10);
  const link = document.createElement("a");

  link.href = URL.createObjectURL(blob);
  link.download = `lobby-backup-${date}.zip`;
  link.click();
  URL.revokeObjectURL(link.href);

  return manifest;
}

export async function importLobbyBackup(file: File) {
  assertClient();

  const zip = await JSZip.loadAsync(file);
  const manifestFile = zip.file("manifest.json");

  if (!manifestFile) {
    throw new Error("This backup is missing manifest.json.");
  }

  const manifest = JSON.parse(await manifestFile.async("text")) as BackupManifest;

  if (manifest.app !== "Lobby" || manifest.version !== 1) {
    throw new Error("This is not a supported Lobby backup.");
  }

  for (const database of manifest.databases) {
    await deleteDatabase(database.name);
    await restoreDatabase(database);
  }

  return manifest;
}
