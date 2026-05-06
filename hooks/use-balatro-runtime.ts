"use client";

import { useCallback, useRef, useState } from "react";

import { getActiveBalatroVersion, MODDED_VERSION, readModState } from "@/lib/mod-storage";

type RuntimeStatus = "idle" | "building" | "ready" | "running" | "error";

type BuildProgress = {
  label: string;
  value: number;
};

type WebBalatroWindow = Window & {
  $?: (id: string) => HTMLElement | null;
  buildFromSource?: (blob: Blob | File, mods: Record<string, unknown>) => Promise<Blob>;
  loadCachedGame?: (key?: string) => Promise<Blob | null>;
  saveGameToCache?: (blob: Blob, key?: string) => Promise<void>;
  Love?: (module: Record<string, unknown>) => void;
  Module?: Record<string, unknown>;
  __lobbyBalatroScripts?: Promise<void>;
  __lobbyBalatroIndexedDbPatched?: boolean;
};

const RUNTIME_BASE = "/lib/web-balatro";
const VANILLA_VERSION = "vanilla";

const buildScriptSources = [
  `${RUNTIME_BASE}/lib/data.js`,
  `${RUNTIME_BASE}/lib/jszip.min.js`,
  `${RUNTIME_BASE}/lib/toml.js`,
  `${RUNTIME_BASE}/patches.js`,
  `${RUNTIME_BASE}/cache.js`,
  `${RUNTIME_BASE}/build.js`,
];

function getRuntimeWindow() {
  return window as WebBalatroWindow;
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-lobby-src="${src}"]`);

    if (existing?.dataset.loaded === "true") {
      resolve();
      return;
    }

    const script = existing ?? document.createElement("script");
    script.dataset.lobbySrc = src;
    script.src = src;
    script.async = false;

    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });

    if (!existing) {
      document.body.appendChild(script);
    }
  });
}

function ensureLegacyBuildTargets() {
  let host = document.getElementById("web-balatro-adapter");

  if (!host) {
    host = document.createElement("div");
    host.id = "web-balatro-adapter";
    host.setAttribute("aria-hidden", "true");
    host.style.display = "none";
    document.body.appendChild(host);
  }

  let progress = document.getElementById("progressBar") as HTMLProgressElement | null;
  if (!progress) {
    progress = document.createElement("progress");
    progress.id = "progressBar";
    progress.max = 100;
    progress.value = 0;
    host.appendChild(progress);
  }

  let status = document.getElementById("status");
  if (!status) {
    status = document.createElement("p");
    status.id = "status";
    status.textContent = "Ready";
    host.appendChild(status);
  }

  return { progress, status };
}

async function ensureBuildScripts() {
  const runtimeWindow = getRuntimeWindow();
  runtimeWindow.$ = (id: string) => document.getElementById(id);

  if (!runtimeWindow.__lobbyBalatroScripts) {
    runtimeWindow.__lobbyBalatroScripts = buildScriptSources.reduce(
      (chain, src) => chain.then(() => loadScript(src)),
      Promise.resolve(),
    );
  }

  await runtimeWindow.__lobbyBalatroScripts;

  if (!runtimeWindow.buildFromSource || !runtimeWindow.loadCachedGame || !runtimeWindow.saveGameToCache) {
    throw new Error("The Balatro runtime did not initialize correctly.");
  }
}

function patchIndexedDbForVersion(version: string) {
  const runtimeWindow = getRuntimeWindow();

  if (runtimeWindow.__lobbyBalatroIndexedDbPatched) {
    return;
  }

  const prefix = `Balatro_${version}_`;
  const originalOpen = indexedDB.open.bind(indexedDB);
  const originalDeleteDatabase = indexedDB.deleteDatabase.bind(indexedDB);

  indexedDB.open = ((name: string, dbVersion?: number) => {
    const prefixedName = `${prefix}${name}`;
    return dbVersion === undefined ? originalOpen(prefixedName) : originalOpen(prefixedName, dbVersion);
  }) as IDBFactory["open"];

  indexedDB.deleteDatabase = ((name: string) => originalDeleteDatabase(`${prefix}${name}`)) as IDBFactory["deleteDatabase"];
  runtimeWindow.__lobbyBalatroIndexedDbPatched = true;
}

export function useBalatroRuntime() {
  const [status, setStatus] = useState<RuntimeStatus>("idle");
  const [progress, setProgress] = useState<BuildProgress>({ label: "Ready", value: 0 });
  const [error, setError] = useState<string | null>(null);
  const launchPromiseRef = useRef<Promise<void> | null>(null);

  const setFailure = useCallback((unknownError: unknown) => {
    const message = unknownError instanceof Error ? unknownError.message : String(unknownError);
    setStatus("error");
    setError(message);
    throw unknownError;
  }, []);

  const hasCachedVersion = useCallback(async () => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      return false;
    }

    await ensureBuildScripts();
    return Boolean(await getRuntimeWindow().loadCachedGame?.(VANILLA_VERSION));
  }, []);

  const buildFromFile = useCallback(
    async (file: File) => {
      try {
        setError(null);
        setStatus("building");
        setProgress({ label: "Preparing build", value: 0 });

        await ensureBuildScripts();
        const { progress: progressEl, status: statusEl } = ensureLegacyBuildTargets();

        const progressTimer = window.setInterval(() => {
          setProgress({
            label: statusEl.textContent || "Building",
            value: Number(progressEl.value) || 0,
          });
        }, 120);

        try {
          const builtGame = await getRuntimeWindow().buildFromSource?.(file, {});

          if (!builtGame) {
            throw new Error("Balatro did not produce a playable build.");
          }

          setProgress({ label: "Saving to this browser", value: 95 });
          await getRuntimeWindow().saveGameToCache?.(builtGame, VANILLA_VERSION);

          setProgress({ label: "Ready", value: 100 });
          setStatus("ready");
        } finally {
          window.clearInterval(progressTimer);
        }
      } catch (unknownError) {
        setFailure(unknownError);
      }
    },
    [setFailure],
  );

  const rebuildWithMods = useCallback(
    async (mods: Record<string, unknown>) => {
      try {
        setError(null);
        setStatus("building");
        setProgress({ label: "Loading clean build", value: 0 });

        await ensureBuildScripts();
        const sourceGame = await getRuntimeWindow().loadCachedGame?.(VANILLA_VERSION);

        if (!sourceGame) {
          throw new Error("Set up Balatro before rebuilding mods.");
        }

        const { progress: progressEl, status: statusEl } = ensureLegacyBuildTargets();
        const progressTimer = window.setInterval(() => {
          setProgress({
            label: statusEl.textContent || "Rebuilding",
            value: Number(progressEl.value) || 0,
          });
        }, 120);

        try {
          const builtGame = await getRuntimeWindow().buildFromSource?.(sourceGame, mods);

          if (!builtGame) {
            throw new Error("Balatro did not produce a modded build.");
          }

          setProgress({ label: "Saving modded build", value: 95 });
          await getRuntimeWindow().saveGameToCache?.(builtGame, MODDED_VERSION);
          setProgress({ label: "Ready", value: 100 });
          setStatus("ready");
        } finally {
          window.clearInterval(progressTimer);
        }
      } catch (unknownError) {
        setFailure(unknownError);
      }
    },
    [setFailure],
  );

  const launch = useCallback(
    async (canvasEl: HTMLCanvasElement) => {
      if (launchPromiseRef.current) {
        return launchPromiseRef.current;
      }

      launchPromiseRef.current = (async () => {
        try {
          setError(null);
          setStatus("running");
          setProgress({ label: "Loading cached build", value: 20 });

          await ensureBuildScripts();
          const modState = await readModState().catch(() => null);
          const version = modState ? getActiveBalatroVersion(modState) : VANILLA_VERSION;
          const cachedGame = await getRuntimeWindow().loadCachedGame?.(version);

          if (!cachedGame) {
            throw new Error("Set up Balatro before launching it.");
          }

          patchIndexedDbForVersion(version);

          const data = new Uint8Array(await cachedGame.arrayBuffer());
          const runtimeWindow = getRuntimeWindow();
          const moduleConfig = runtimeWindow.Module ?? {};

          canvasEl.id = "canvas";
          moduleConfig.INITIAL_MEMORY = 268435456;
          moduleConfig.canvas = canvasEl;
          moduleConfig.printErr = console.error;
          moduleConfig.arguments = ["game.love"];
          moduleConfig.locateFile = (path: string) =>
            path.endsWith(".wasm") ? `${RUNTIME_BASE}/run/11.5/${path}` : path;
          moduleConfig.preRun = [
            function preloadGame() {
              const moduleRuntime = getRuntimeWindow().Module as {
                addRunDependency: (dependency: string) => void;
                removeRunDependency: (dependency: string) => void;
                getMemory: (size: number) => number;
                HEAPU8: Uint8Array;
                FS_createDataFile: (
                  parent: string,
                  name: string,
                  data: Uint8Array,
                  canRead: boolean,
                  canWrite: boolean,
                  canOwn: boolean,
                ) => void;
              };

              moduleRuntime.addRunDependency("fp game.love");
              const pointer = moduleRuntime.getMemory(data.length);
              moduleRuntime.HEAPU8.set(data, pointer);
              moduleRuntime.FS_createDataFile("/", "game.love", data, true, true, true);
              moduleRuntime.removeRunDependency("fp game.love");
            },
          ];

          runtimeWindow.Module = moduleConfig;
          setProgress({ label: "Starting love.js", value: 70 });

          await new Promise<void>((resolve, reject) => {
            if (runtimeWindow.Love) {
              runtimeWindow.Love(moduleConfig);
              resolve();
              return;
            }

            const script = document.createElement("script");
            script.src = `${RUNTIME_BASE}/run/11.5/love.min.js`;
            script.async = true;
            script.addEventListener(
              "load",
              () => {
                if (!runtimeWindow.Love) {
                  reject(new Error("love.js loaded without exposing the Love runtime."));
                  return;
                }

                runtimeWindow.Love(moduleConfig);
                resolve();
              },
              { once: true },
            );
            script.addEventListener("error", () => reject(new Error("Could not load love.js.")), { once: true });
            document.body.appendChild(script);
          });

          setProgress({ label: "Running", value: 100 });
          setStatus("running");
        } catch (unknownError) {
          launchPromiseRef.current = null;
          setFailure(unknownError);
        }
      })();

      return launchPromiseRef.current;
    },
    [setFailure],
  );

  const clearError = useCallback(() => {
    setError(null);
    setStatus((currentStatus) => (currentStatus === "error" ? "idle" : currentStatus));
  }, []);

  return {
    status,
    progress,
    error,
    clearError,
    buildFromFile,
    rebuildWithMods,
    launch,
    hasCachedVersion,
  };
}
