"use client";

import { useCallback, useEffect, useState } from "react";

import { readPreferences, writePreferences } from "@/lib/preferences";

export type StorageEstimate = {
  usage: number;
  quota: number;
  persisted: boolean;
};

type UsePersistentStorageOptions = {
  requestPersistence?: boolean;
};

const emptyEstimate: StorageEstimate = {
  usage: 0,
  quota: 0,
  persisted: false,
};

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 MB";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let value = bytes;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  const rounded = value >= 10 || unitIndex === 0 ? Math.round(value) : Math.round(value * 10) / 10;
  return `${rounded} ${units[unitIndex]}`;
}

async function getStorageEstimate(): Promise<StorageEstimate> {
  if (typeof navigator === "undefined" || !navigator.storage) {
    return emptyEstimate;
  }

  const [estimate, persisted] = await Promise.all([
    navigator.storage.estimate?.() ?? Promise.resolve({ usage: 0, quota: 0 }),
    navigator.storage.persisted?.() ?? Promise.resolve(false),
  ]);

  return {
    usage: estimate.usage ?? 0,
    quota: estimate.quota ?? 0,
    persisted,
  };
}

export function usePersistentStorage(options: UsePersistentStorageOptions = {}) {
  const [estimate, setEstimate] = useState<StorageEstimate>(emptyEstimate);
  const [isLoading, setIsLoading] = useState(true);
  const [showSecuredToast, setShowSecuredToast] = useState(false);
  const requestPersistence = options.requestPersistence ?? false;

  const refreshEstimate = useCallback(async () => {
    const nextEstimate = await getStorageEstimate();
    setEstimate(nextEstimate);
    return nextEstimate;
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const preferences = await readPreferences();
        let persisted = await navigator.storage?.persisted?.();

        if (requestPersistence && navigator.storage?.persist && !persisted) {
          persisted = await navigator.storage.persist();
        }

        const nextEstimate = await getStorageEstimate();

        if (!cancelled) {
          setEstimate({ ...nextEstimate, persisted: Boolean(persisted ?? nextEstimate.persisted) });
        }

        if (requestPersistence && (persisted || nextEstimate.persisted) && !preferences.storageToastShown) {
          await writePreferences({ ...preferences, storageToastShown: true });

          if (!cancelled) {
            setShowSecuredToast(true);
          }
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    if (typeof window === "undefined" || typeof navigator === "undefined" || !navigator.storage) {
      setIsLoading(false);
      return;
    }

    run().catch(() => {
      if (!cancelled) {
        setIsLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [refreshEstimate, requestPersistence]);

  return {
    estimate,
    isLoading,
    refreshEstimate,
    showSecuredToast,
    dismissSecuredToast: () => setShowSecuredToast(false),
  };
}
