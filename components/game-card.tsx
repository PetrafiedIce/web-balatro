"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GameCardProps = {
  title: string;
  author: string;
  icon: LucideIcon;
  status: "ready" | "setup-needed" | "locked";
  isChecking?: boolean;
  onSetupClick?: () => void;
  launchHref?: string;
  modsHref?: string;
};

export function GameCard({
  title,
  author,
  icon: Icon,
  status,
  isChecking = false,
  onSetupClick,
  launchHref,
  modsHref,
}: GameCardProps) {
  const isLocked = status === "locked";
  const isReady = status === "ready";
  const statusLabel = isChecking ? "Checking" : isLocked ? "Coming soon" : isReady ? "Ready" : "Setup needed";

  return (
    <Card className={cn("min-h-[240px]", isLocked && "opacity-55")}>
      <CardHeader className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-foreground">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </div>
          <Badge tone={isReady && !isLocked ? "success" : isLocked ? "muted" : "default"}>{statusLabel}</Badge>
        </div>
        <div>
          <h3 className="text-lg font-medium tracking-[-0.01em] text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{author}</p>
        </div>
      </CardHeader>
      <CardContent className="mt-auto">
        {isLocked ? (
          <Button variant="secondary" className="w-full" disabled>
            Coming soon
          </Button>
        ) : isReady && launchHref ? (
          <div className="grid grid-cols-2 gap-2">
            <Button asChild>
              <Link href={launchHref}>Launch</Link>
            </Button>
            {modsHref ? (
              <Button asChild variant="secondary">
                <Link href={modsHref}>Mods</Link>
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button disabled={isChecking} onClick={onSetupClick}>
              Set up
            </Button>
            {modsHref ? (
              <Button asChild variant="secondary">
                <Link href={modsHref}>Mods</Link>
              </Button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
