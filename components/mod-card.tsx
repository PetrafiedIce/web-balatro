"use client";

import { ExternalLink } from "lucide-react";

import { CompatBadge } from "@/components/compat-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { ModEntry } from "@/lib/mod-registry";
import { cn } from "@/lib/utils";

type ModCardProps = {
  mod: ModEntry;
  isInstalled: boolean;
  canInstall: boolean;
  installLabel?: string;
  disabledReason?: string;
  isBusy?: boolean;
  onInstall: () => void;
  onOpen: () => void;
};

function InstallButton({
  canInstall,
  disabledReason,
  isBusy,
  installLabel,
  onInstall,
}: Pick<ModCardProps, "canInstall" | "disabledReason" | "isBusy" | "installLabel" | "onInstall">) {
  const button = (
    <Button disabled={!canInstall || isBusy} size="sm" type="button" onClick={onInstall}>
      {isBusy ? "Installing" : installLabel ?? "Install"}
    </Button>
  );

  if (canInstall || !disabledReason) {
    return button;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className="inline-flex">{button}</span>
        </TooltipTrigger>
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function ModCard({
  mod,
  isInstalled,
  canInstall,
  installLabel,
  disabledReason,
  isBusy = false,
  onInstall,
  onOpen,
}: ModCardProps) {
  return (
    <Card className={cn("flex min-h-[310px] flex-col overflow-hidden", mod.tier === "incompatible" && "opacity-65")}>
      <button type="button" className="text-left" onClick={onOpen}>
        <div className="flex h-32 items-center justify-center border-b border-border bg-muted text-sm text-muted-foreground">
          {mod.thumbnail ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mod.thumbnail} alt="" className="h-full w-full object-cover" />
          ) : (
            <span>{mod.category}</span>
          )}
        </div>
      </button>
      <CardHeader className="gap-4">
        <div className="flex items-start justify-between gap-3">
          <button type="button" className="text-left" onClick={onOpen}>
            <h3 className="text-base font-medium tracking-[-0.01em]">{mod.name}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{mod.author}</p>
          </button>
          <CompatBadge tier={mod.tier} />
        </div>
        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{mod.description}</p>
      </CardHeader>
      <CardContent className="mt-auto space-y-4">
        <div className="flex flex-wrap gap-2">
          {mod.tags.slice(0, 4).map((tag) => (
            <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between gap-3">
          <a
            href={mod.source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            Source
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <InstallButton
            canInstall={canInstall}
            disabledReason={disabledReason}
            installLabel={isInstalled ? "Reinstall" : installLabel}
            isBusy={isBusy}
            onInstall={onInstall}
          />
        </div>
      </CardContent>
    </Card>
  );
}
