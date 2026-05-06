"use client";

import { ExternalLink } from "lucide-react";

import { CompatBadge } from "@/components/compat-badge";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { ModEntry } from "@/lib/mod-registry";

type ModDetailSheetProps = {
  mod: ModEntry | null;
  open: boolean;
  installLabel: string;
  installDisabled: boolean;
  onOpenChange: (open: boolean) => void;
  onInstall: (mod: ModEntry) => void;
};

export function ModDetailSheet({
  mod,
  open,
  installLabel,
  installDisabled,
  onOpenChange,
  onInstall,
}: ModDetailSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {mod ? (
          <div className="flex h-full flex-col">
            <SheetHeader>
              <div className="mb-2">
                <CompatBadge tier={mod.tier} />
              </div>
              <SheetTitle>{mod.name}</SheetTitle>
              <SheetDescription>
                {mod.author} <span aria-hidden="true">&middot;</span> {mod.version}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 flex-1 space-y-6 overflow-y-auto pr-1">
              <div className="flex aspect-video items-center justify-center rounded-xl border border-border bg-muted text-sm text-muted-foreground">
                {mod.thumbnail ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    alt={`${mod.name} screenshot`}
                    className="h-full w-full rounded-xl object-cover"
                    src={mod.thumbnail}
                  />
                ) : (
                  <span>Screenshot unavailable</span>
                )}
              </div>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">Description</h3>
                <p className="text-sm leading-6 text-muted-foreground">{mod.description}</p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">Compatibility</h3>
                <p className="text-sm leading-6 text-muted-foreground">
                  {mod.tier === "verified"
                    ? "Verified mods do not require SMODS and are expected to rebuild cleanly."
                    : mod.tier === "experimental"
                      ? "Experimental mods require a Lovely Dump import before install."
                      : "This mod is shown for visibility but is disabled until compatibility is verified."}
                </p>
              </section>

              <section className="space-y-2">
                <h3 className="text-sm font-medium">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {mod.tags.map((tag) => (
                    <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {tag}
                    </span>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-6 flex gap-2 border-t border-border pt-4">
              <Button className="flex-1" disabled={installDisabled} onClick={() => onInstall(mod)}>
                {installLabel}
              </Button>
              <Button asChild size="icon" variant="outline">
                <a aria-label="Open source" href={mod.source} rel="noreferrer" target="_blank">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
