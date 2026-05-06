"use client";

import { ArrowLeft, Maximize2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { GameCanvas } from "@/components/game-canvas";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useBalatroRuntime } from "@/hooks/use-balatro-runtime";

export default function BalatroPlayPage() {
  const { error, launch, progress, status } = useBalatroRuntime();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const hasLaunchedRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || hasLaunchedRef.current) {
      return;
    }

    hasLaunchedRef.current = true;
    launch(canvasRef.current).catch(() => {
      hasLaunchedRef.current = false;
    });
  }, [launch]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const leaveGame = () => {
    window.location.assign("/");
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await shellRef.current?.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  return (
    <main ref={shellRef} className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <Button aria-label="Back to library" size="icon" variant="ghost" onClick={leaveGame}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <p className="text-sm font-medium leading-none">Balatro</p>
            <p className="mt-1 text-xs text-muted-foreground">{progress.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} size="icon" variant="outline" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button aria-label="Exit game" size="icon" variant="outline" onClick={leaveGame}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="relative min-h-0 flex-1 bg-black">
        <GameCanvas ref={canvasRef} />
        {status !== "running" || progress.value < 100 ? (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium">Starting Balatro</p>
              <p className="mt-2 text-sm text-muted-foreground">{error ?? progress.label}</p>
              <Progress className="mt-4" value={status === "error" ? 100 : progress.value} />
              {status === "error" ? (
                <Button className="mt-4 w-full" variant="secondary" onClick={leaveGame}>
                  Return to library
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
