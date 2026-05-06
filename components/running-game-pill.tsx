"use client";

import { Spade } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Button } from "@/components/ui/button";
import { useGameSession } from "@/contexts/game-session-context";

export function RunningGamePill() {
  const pathname = usePathname();
  const { activeGame, isRunning } = useGameSession();

  if (!activeGame || pathname === "/play/balatro") {
    return null;
  }

  return (
    <div className="fixed bottom-5 right-5 z-40 animate-in rounded-full border border-border bg-card p-2 text-sm text-foreground">
      <div className="flex items-center gap-3 pl-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-muted">
          <Spade className="h-4 w-4" aria-hidden="true" />
        </span>
        <div className="leading-tight">
          <p className="font-medium">Balatro is running</p>
          <p className="text-xs text-muted-foreground">{isRunning ? "Live in the background" : "Starting"}</p>
        </div>
        <Button asChild size="sm">
          <Link href="/play/balatro">Resume</Link>
        </Button>
      </div>
    </div>
  );
}
