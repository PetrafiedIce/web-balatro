"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

import { useBalatroRuntime } from "@/hooks/use-balatro-runtime";

type ActiveGame = "balatro" | null;

type GameSessionContextValue = {
  activeGame: ActiveGame;
  isRunning: boolean;
  launchedAt: number | null;
  runtime: ReturnType<typeof useBalatroRuntime>;
  registerCanvas: (canvas: HTMLCanvasElement | null) => void;
  launchBalatro: () => Promise<void>;
  exitGame: () => void;
};

const GameSessionContext = createContext<GameSessionContextValue | null>(null);

export function GameSessionProvider({ children }: { children: ReactNode }) {
  const runtime = useBalatroRuntime();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pendingCanvasResolvers = useRef<Array<(canvas: HTMLCanvasElement) => void>>([]);
  const launchPromiseRef = useRef<Promise<void> | null>(null);
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [launchedAt, setLaunchedAt] = useState<number | null>(null);

  const registerCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    canvasRef.current = canvas;

    if (!canvas) {
      return;
    }

    const resolvers = pendingCanvasResolvers.current;
    pendingCanvasResolvers.current = [];
    resolvers.forEach((resolve) => resolve(canvas));
  }, []);

  const waitForCanvas = useCallback(() => {
    if (canvasRef.current) {
      return Promise.resolve(canvasRef.current);
    }

    return new Promise<HTMLCanvasElement>((resolve) => {
      pendingCanvasResolvers.current.push(resolve);
    });
  }, []);

  const launchBalatro = useCallback(async () => {
    if (activeGame === "balatro" && isRunning) {
      return;
    }

    if (launchPromiseRef.current) {
      return launchPromiseRef.current;
    }

    launchPromiseRef.current = (async () => {
      setActiveGame("balatro");

      if (!launchedAt) {
        setLaunchedAt(Date.now());
      }

      try {
        const canvas = await waitForCanvas();
        await runtime.launch(canvas);
        setIsRunning(true);
      } catch (error) {
        setActiveGame(null);
        setIsRunning(false);
        setLaunchedAt(null);
        throw error;
      } finally {
        launchPromiseRef.current = null;
      }
    })();

    return launchPromiseRef.current;
  }, [activeGame, isRunning, launchedAt, runtime, waitForCanvas]);

  const exitGame = useCallback(() => {
    setActiveGame(null);
    setIsRunning(false);
    setLaunchedAt(null);
    window.location.assign("/");
  }, []);

  const value = useMemo(
    () => ({
      activeGame,
      isRunning,
      launchedAt,
      runtime,
      registerCanvas,
      launchBalatro,
      exitGame,
    }),
    [activeGame, exitGame, isRunning, launchBalatro, launchedAt, registerCanvas, runtime],
  );

  return <GameSessionContext.Provider value={value}>{children}</GameSessionContext.Provider>;
}

export function useGameSession() {
  const context = useContext(GameSessionContext);

  if (!context) {
    throw new Error("useGameSession must be used inside GameSessionProvider.");
  }

  return context;
}
