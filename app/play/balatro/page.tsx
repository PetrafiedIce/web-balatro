"use client";

import { ArrowLeft, Maximize2, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useGameSession } from "@/contexts/game-session-context";

export default function BalatroPlayPage() {
  const { exitGame, isRunning, launchBalatro, runtime } = useGameSession();
  const { error, progress, status } = runtime;
  const hasLaunchedRef = useRef(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExitOpen, setIsExitOpen] = useState(false);

  useEffect(() => {
    if (hasLaunchedRef.current || isRunning) {
      return;
    }

    hasLaunchedRef.current = true;
    launchBalatro().catch(() => {
      hasLaunchedRef.current = false;
    });
  }, [isRunning, launchBalatro]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
      return;
    }

    await document.exitFullscreen();
  };

  return (
    <main className="flex min-h-screen flex-col bg-background text-foreground">
      <div className="relative z-20 flex h-14 items-center justify-between border-b border-border bg-background px-4">
        <div className="flex items-center gap-3">
          <Button asChild aria-label="Back to library" size="icon" variant="ghost">
            <Link href="/">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-sm font-medium leading-none">Balatro</p>
            <p className="mt-1 text-xs text-muted-foreground">{progress.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href="/library/balatro/mods">Mods</Link>
          </Button>
          <Button aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} size="icon" variant="outline" onClick={toggleFullscreen}>
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button aria-label="Exit game" size="icon" variant="outline" onClick={() => setIsExitOpen(true)}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <section className="relative min-h-0 flex-1 bg-black">
        {status !== "running" || progress.value < 100 ? (
          <div className="fixed inset-x-0 bottom-0 top-14 z-10 flex items-center justify-center bg-background/95">
            <div className="w-full max-w-sm rounded-xl border border-border bg-card p-5">
              <p className="text-sm font-medium">Starting Balatro</p>
              <p className="mt-2 text-sm text-muted-foreground">{error ?? progress.label}</p>
              <Progress className="mt-4" value={status === "error" ? 100 : progress.value} />
              {status === "error" ? (
                <Button asChild className="mt-4 w-full" variant="secondary">
                  <Link href="/">
                    Return to library
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </section>

      <Dialog open={isExitOpen} onOpenChange={setIsExitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exit Balatro?</DialogTitle>
            <DialogDescription>Your progress is saved. Exiting ends the live browser session.</DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-2">
            <Button onClick={exitGame}>Exit game</Button>
            <Button variant="secondary" onClick={() => setIsExitOpen(false)}>
              Keep playing
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
