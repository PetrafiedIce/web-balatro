"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  getModBuildSignature,
  isRebuildNeeded,
  type InstalledMod,
  type LovelyDumpState,
  type ModState,
  readModState,
  writeModState,
} from "@/lib/mod-storage";

export function useInstalledMods() {
  const [state, setState] = useState<ModState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    const nextState = await readModState();
    setState(nextState);
    setIsLoading(false);
    return nextState;
  }, []);

  useEffect(() => {
    refresh().catch(() => setIsLoading(false));
  }, [refresh]);

  const updateState = useCallback(async (updater: (state: ModState) => ModState) => {
    const currentState = await readModState();
    const nextState = updater(currentState);
    await writeModState(nextState);
    setState(nextState);
    return nextState;
  }, []);

  const setInstalledMod = useCallback(
    (mod: InstalledMod) =>
      updateState((currentState) => {
        const withoutExisting = currentState.installed.filter((installed) => installed.id !== mod.id);
        return {
          ...currentState,
          installed: [...withoutExisting, mod].sort((a, b) => a.order - b.order),
        };
      }),
    [updateState],
  );

  const toggleMod = useCallback(
    (id: string, enabled: boolean) =>
      updateState((currentState) => ({
        ...currentState,
        installed: currentState.installed.map((mod) => (mod.id === id ? { ...mod, enabled } : mod)),
      })),
    [updateState],
  );

  const reorderMods = useCallback(
    (ids: string[]) =>
      updateState((currentState) => ({
        ...currentState,
        installed: currentState.installed
          .map((mod) => ({ ...mod, order: ids.indexOf(mod.id) === -1 ? mod.order : ids.indexOf(mod.id) }))
          .sort((a, b) => a.order - b.order),
      })),
    [updateState],
  );

  const setLovelyDump = useCallback(
    (lovelyDump: LovelyDumpState) =>
      updateState((currentState) => ({
        ...currentState,
        lovelyDump,
      })),
    [updateState],
  );

  const markBuilt = useCallback(
    () =>
      updateState((currentState) => ({
        ...currentState,
        lastBuiltSignature: getModBuildSignature(currentState),
      })),
    [updateState],
  );

  const rebuildNeeded = useMemo(() => (state ? isRebuildNeeded(state) : false), [state]);

  return {
    state,
    isLoading,
    rebuildNeeded,
    refresh,
    setInstalledMod,
    toggleMod,
    reorderMods,
    setLovelyDump,
    markBuilt,
  };
}
