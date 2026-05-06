import Link from "next/link";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type RebuildBannerProps = {
  actionHref?: string;
  actionLabel?: string;
  disabledReason?: string;
  isRebuilding?: boolean;
  message?: string;
  onRebuild?: () => void;
};

export function RebuildBanner({
  actionHref,
  actionLabel = "Rebuild",
  disabledReason,
  isRebuilding = false,
  message = "Installed mods changed since the last modded build. Rebuild before launching to apply the current loadout.",
  onRebuild,
}: RebuildBannerProps) {
  const rebuildButton = (
    <Button disabled={isRebuilding || Boolean(disabledReason)} onClick={onRebuild}>
      {isRebuilding ? "Rebuilding" : actionLabel}
    </Button>
  );

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] border border-border bg-card">
          <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">Rebuild needed</p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </div>
      {actionHref ? (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : disabledReason ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{rebuildButton}</span>
            </TooltipTrigger>
            <TooltipContent>{disabledReason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        rebuildButton
      )}
    </div>
  );
}
