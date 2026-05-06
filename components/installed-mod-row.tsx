"use client";

import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type * as React from "react";

import { CompatBadge } from "@/components/compat-badge";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import type { InstalledMod } from "@/lib/mod-storage";
import type { ModEntry } from "@/lib/mod-registry";
import { cn } from "@/lib/utils";

type InstalledModRowProps = {
  installedMod: InstalledMod;
  entry: ModEntry;
  listeners?: unknown;
  attributes?: unknown;
  setNodeRef?: (node: HTMLDivElement | null) => void;
  transform?: { x: number; y: number; scaleX: number; scaleY: number } | null;
  transition?: string;
  isDragging?: boolean;
  disabledReason?: string;
  onToggle: (enabled: boolean) => void;
};

export function InstalledModRow({
  installedMod,
  entry,
  listeners,
  attributes,
  setNodeRef,
  transform,
  transition,
  isDragging = false,
  disabledReason,
  onToggle,
}: InstalledModRowProps) {
  const dragAttributes = attributes as React.ButtonHTMLAttributes<HTMLButtonElement> | undefined;
  const dragListeners = listeners as React.ButtonHTMLAttributes<HTMLButtonElement> | undefined;
  const isDisabled = Boolean(disabledReason);
  const switchControl = (
    <Switch
      checked={installedMod.enabled}
      aria-label={`Enable ${entry.name}`}
      disabled={isDisabled}
      onCheckedChange={onToggle}
    />
  );

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform ?? null),
        transition,
      }}
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border bg-card p-4",
        isDragging && "z-10 border-foreground/30",
      )}
    >
      <button
        type="button"
        disabled={isDisabled}
        className="cursor-grab rounded-md p-1 text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label={`Drag ${entry.name}`}
        {...dragAttributes}
        {...dragListeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium">{entry.name}</p>
          <CompatBadge tier={entry.tier} />
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {entry.author} &middot; {installedMod.files.length} files &middot; {installedMod.version}
        </p>
      </div>
      {disabledReason ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex">{switchControl}</span>
            </TooltipTrigger>
            <TooltipContent>{disabledReason}</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        switchControl
      )}
    </div>
  );
}
