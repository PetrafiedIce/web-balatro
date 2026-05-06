"use client";

import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";

import { ModCard } from "@/components/mod-card";
import { ModDetailSheet } from "@/components/mod-detail-sheet";
import { Nav } from "@/components/nav";
import { RebuildBanner } from "@/components/rebuild-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useInstalledMods } from "@/hooks/use-installed-mods";
import { useModInstaller } from "@/hooks/use-mod-installer";
import { modRegistry, type ModEntry } from "@/lib/mod-registry";

const tierOptions = ["all", "verified", "experimental", "incompatible"] as const;
const categoryOptions = ["all", "qol", "content", "cosmetic", "gameplay", "utility"] as const;

type TierFilter = (typeof tierOptions)[number];
type CategoryFilter = (typeof categoryOptions)[number];

function getInstallState(mod: ModEntry, hasLovelyDump: boolean) {
  if (mod.tier === "incompatible") {
    return {
      canInstall: false,
      reason: "This mod is marked incompatible until someone verifies a browser-safe install path.",
      label: "Disabled",
    };
  }

  if (mod.requiresLovelyDump && !hasLovelyDump) {
    return {
      canInstall: false,
      reason: "Experimental SMODS mods need a Lovely Dump zip before install.",
      label: "Import dump first",
    };
  }

  return {
    canInstall: true,
    reason: undefined,
    label: mod.tier === "experimental" ? "Install experimental" : "Install",
  };
}

export default function ModBrowserPage() {
  const installedMods = useInstalledMods();
  const installer = useModInstaller();
  const [query, setQuery] = useState("");
  const [tier, setTier] = useState<TierFilter>("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [selectedMod, setSelectedMod] = useState<ModEntry | null>(null);
  const [busyModId, setBusyModId] = useState<string | null>(null);

  const hasLovelyDump = Boolean(installedMods.state?.lovelyDump);
  const installedIds = useMemo(
    () => new Set(installedMods.state?.installed.map((mod) => mod.id) ?? []),
    [installedMods.state],
  );

  const filteredMods = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return modRegistry.filter((mod) => {
      const matchesQuery =
        !normalizedQuery ||
        [mod.name, mod.author, mod.description, ...mod.tags].some((value) =>
          value.toLowerCase().includes(normalizedQuery),
        );
      const matchesTier = tier === "all" || mod.tier === tier;
      const matchesCategory = category === "all" || mod.category === category;

      return matchesQuery && matchesTier && matchesCategory;
    });
  }, [category, query, tier]);

  async function installMod(mod: ModEntry) {
    setBusyModId(mod.id);

    try {
      await installer.install(mod);
      await installedMods.refresh();
    } finally {
      setBusyModId(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground">Balatro</p>
            <h1 className="text-3xl font-medium tracking-[-0.03em]">Mod browser</h1>
            <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
              Curated one-click installs for browser-safe Balatro mods. Compatibility is shown before install.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="secondary">
              <Link href="/library/balatro/mods/installed">Installed mods</Link>
            </Button>
            <Button asChild variant="ghost">
              <Link href="/">Library</Link>
            </Button>
          </div>
        </div>

        {installedMods.rebuildNeeded ? (
          <RebuildBanner
            actionHref="/library/balatro/mods/installed"
            actionLabel="Review and rebuild"
            message="Your installed mod state has changed since the last build."
          />
        ) : null}

        <Card>
          <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_180px_180px]">
            <label className="flex items-center gap-2 rounded-xl border border-border bg-background px-3">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search mods"
                className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </label>
            <select
              value={tier}
              onChange={(event) => setTier(event.target.value as TierFilter)}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {tierOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All tiers" : option}
                </option>
              ))}
            </select>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryFilter)}
              className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            >
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option === "all" ? "All categories" : option}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredMods.map((mod) => {
            const installState = getInstallState(mod, hasLovelyDump);

            return (
              <ModCard
                key={mod.id}
                canInstall={installState.canInstall}
                disabledReason={installState.reason}
                installLabel={installState.label}
                isBusy={busyModId === mod.id}
                isInstalled={installedIds.has(mod.id)}
                mod={mod}
                onInstall={() => void installMod(mod)}
                onOpen={() => setSelectedMod(mod)}
              />
            );
          })}
        </section>

        {filteredMods.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No curated mods match those filters.
            </CardContent>
          </Card>
        ) : null}
      </main>

      <ModDetailSheet
        installDisabled={selectedMod ? !getInstallState(selectedMod, hasLovelyDump).canInstall : true}
        installLabel={selectedMod ? getInstallState(selectedMod, hasLovelyDump).label : "Install"}
        mod={selectedMod}
        onInstall={(mod) => void installMod(mod)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedMod(null);
          }
        }}
        open={Boolean(selectedMod)}
      />
    </div>
  );
}
