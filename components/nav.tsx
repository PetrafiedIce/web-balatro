"use client";

import Link from "next/link";
import { CreditCard } from "lucide-react";

import { useGameSession } from "@/contexts/game-session-context";
import { cn } from "@/lib/utils";

export function Nav({ className }: { className?: string }) {
  const { activeGame } = useGameSession();

  return (
    <header className={cn("border-b border-border bg-background", className)}>
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 text-sm font-medium text-foreground">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card">
            <CreditCard className="h-4 w-4" strokeWidth={1.75} />
          </span>
          <span>Lobby</span>
        </Link>

        <div className="flex items-center gap-1 text-sm">
          {activeGame === "balatro" ? (
            <Link
              className="rounded-[10px] border border-border px-3 py-2 text-foreground hover:bg-muted"
              href="/play/balatro"
            >
              Currently playing
            </Link>
          ) : null}
          <Link className="rounded-[10px] px-3 py-2 text-foreground hover:bg-muted" href="/">
            Library
          </Link>
          <Link
            className="rounded-[10px] px-3 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            href="/settings"
          >
            Settings
          </Link>
        </div>
      </nav>
    </header>
  );
}
