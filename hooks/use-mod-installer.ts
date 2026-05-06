"use client";

import JSZip from "jszip";
import { useCallback, useState } from "react";

import { useBalatroRuntime } from "@/hooks/use-balatro-runtime";
import {
  getEnabledMods,
  getModBuildSignature,
  type InstalledMod,
  type ModState,
  readModState,
  type StoredModFile,
  writeModState,
} from "@/lib/mod-storage";
import type { ModEntry } from "@/lib/mod-registry";
import { modRegistry } from "@/lib/mod-registry";

type InstallerStatus = "idle" | "fetching" | "extracting" | "patching" | "installing" | "rebuilding" | "done" | "error";

type InstallerProgress = {
  status: InstallerStatus;
  label: string;
  value: number;
};

const initialProgress: InstallerProgress = {
  status: "idle",
  label: "Ready",
  value: 0,
};

function normalizeZipPath(path: string, rootPrefix: string) {
  return rootPrefix && path.startsWith(rootPrefix) ? path.slice(rootPrefix.length) : path;
}

function getCommonRoot(paths: string[]) {
  if (paths.length === 0) {
    return "";
  }

  const roots = new Set(paths.map((path) => path.split("/")[0]));
  return roots.size === 1 ? `${paths[0].split("/")[0]}/` : "";
}

async function fetchModArchive(entry: ModEntry) {
  try {
    const directResponse = await fetch(entry.downloadUrl);

    if (directResponse.ok) {
      return directResponse.blob();
    }
  } catch {
    // Fall back to the curated proxy route when a host does not allow browser CORS.
  }

  const proxyResponse = await fetch(`/api/mod-proxy?url=${encodeURIComponent(entry.downloadUrl)}`);

  if (!proxyResponse.ok) {
    throw new Error(`Could not download ${entry.name}.`);
  }

  return proxyResponse.blob();
}

async function unzipArchive(blob: Blob, options: { fixQuadQuotes: boolean; stripCommonRoot: boolean }) {
  const zip = await JSZip.loadAsync(blob);
  const entries = Object.values(zip.files).filter((file) => !file.dir);
  const rootPrefix = options.stripCommonRoot ? getCommonRoot(entries.map((entry) => entry.name)) : "";
  const files: StoredModFile[] = [];

  for (const entry of entries) {
    const normalizedPath = normalizeZipPath(entry.name, rootPrefix);

    if (!normalizedPath) {
      continue;
    }

    if (options.fixQuadQuotes && normalizedPath.endsWith(".toml")) {
      const text = (await entry.async("text")).replaceAll('""""', '"" ""');
      files.push({
        path: normalizedPath,
        data: await new Blob([text], { type: "text/plain" }).arrayBuffer(),
        type: "text/plain",
      });
      continue;
    }

    files.push({
      path: normalizedPath,
      data: await entry.async("arraybuffer"),
      type: "application/octet-stream",
    });
  }

  return files;
}

function writeNestedFile(target: Record<string, unknown>, file: StoredModFile) {
  const pathParts = file.path.split("/").filter(Boolean);
  let current = target;

  for (const part of pathParts.slice(0, -1)) {
    const next = current[part];

    if (!next || next instanceof File) {
      current[part] = {};
    }

    current = current[part] as Record<string, unknown>;
  }

  const fileName = pathParts[pathParts.length - 1];
  current[fileName] = new File([file.data], fileName, { type: file.type });
}

function filesToModObject(files: StoredModFile[]) {
  const object: Record<string, unknown> = {};

  for (const file of files) {
    writeNestedFile(object, file);
  }

  return object;
}

function buildModsObject(state: ModState) {
  const mods: Record<string, unknown> = {};

  if (state.lovelyDump) {
    mods["Dump from Lovely"] = filesToModObject(state.lovelyDump.files);
  }

  for (const installedMod of getEnabledMods(state)) {
    const entry = modRegistry.find((candidate) => candidate.id === installedMod.id);

    if (!entry) {
      continue;
    }

    mods[entry.name] = filesToModObject(installedMod.files);
  }

  return mods;
}

export function useModInstaller() {
  const runtime = useBalatroRuntime();
  const [progress, setProgress] = useState<InstallerProgress>(initialProgress);
  const [error, setError] = useState<string | null>(null);

  const install = useCallback(async (entry: ModEntry) => {
    try {
      setError(null);

      if (entry.tier === "incompatible") {
        throw new Error(`${entry.name} is marked incompatible and cannot be installed.`);
      }

      const state = await readModState();

      if (entry.requiresLovelyDump && !state.lovelyDump) {
        throw new Error(`${entry.name} needs a Lovely Dump before it can be installed.`);
      }

      setProgress({ status: "fetching", label: `Downloading ${entry.name}`, value: 15 });
      const archive = await fetchModArchive(entry);

      setProgress({ status: "extracting", label: "Extracting archive", value: 45 });
      const files = await unzipArchive(archive, {
        fixQuadQuotes: entry.autoPatch.fixQuadQuotes,
        stripCommonRoot: true,
      });

      setProgress({ status: "installing", label: "Saving mod to this browser", value: 80 });
      const existing = state.installed.filter((mod) => mod.id !== entry.id);
      const nextOrder = existing.length === 0 ? 0 : Math.max(...existing.map((mod) => mod.order)) + 1;
      const installedMod: InstalledMod = {
        id: entry.id,
        enabled: true,
        order: nextOrder,
        installedAt: Date.now(),
        version: entry.version,
        files,
      };

      await writeModState({
        ...state,
        installed: [...existing, installedMod],
      });

      setProgress({ status: "done", label: "Installed. Rebuild needed.", value: 100 });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : String(unknownError);
      setError(message);
      setProgress({ status: "error", label: message, value: 100 });
      throw unknownError;
    }
  }, []);

  const importLovelyDump = useCallback(async (file: File) => {
    try {
      setError(null);
      setProgress({ status: "extracting", label: "Importing Lovely Dump", value: 30 });
      const files = await unzipArchive(file, { fixQuadQuotes: true, stripCommonRoot: true });
      const state = await readModState();

      await writeModState({
        ...state,
        lovelyDump: {
          importedAt: Date.now(),
          fileName: file.name,
          files,
        },
      });

      setProgress({ status: "done", label: "Lovely Dump imported. Rebuild needed.", value: 100 });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : String(unknownError);
      setError(message);
      setProgress({ status: "error", label: message, value: 100 });
      throw unknownError;
    }
  }, []);

  const rebuild = useCallback(async () => {
    try {
      setError(null);
      setProgress({ status: "rebuilding", label: "Preparing modded build", value: 5 });
      const state = await readModState();
      const mods = buildModsObject(state);

      await runtime.rebuildWithMods(mods);

      const latestState = await readModState();
      await writeModState({
        ...latestState,
        lastBuiltSignature: getModBuildSignature(latestState),
      });

      setProgress({ status: "done", label: "Modded build is ready.", value: 100 });
    } catch (unknownError) {
      const message = unknownError instanceof Error ? unknownError.message : String(unknownError);
      setError(message);
      setProgress({ status: "error", label: message, value: 100 });
      throw unknownError;
    }
  }, [runtime]);

  const clear = useCallback(() => {
    setError(null);
    setProgress(initialProgress);
  }, []);

  return {
    error,
    progress,
    runtimeProgress: runtime.progress,
    runtimeStatus: runtime.status,
    clear,
    install,
    importLovelyDump,
    rebuild,
  };
}
