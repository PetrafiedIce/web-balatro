"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ArrowLeft, Download, FolderInput, Plus } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";

import { InstalledModRow } from "@/components/installed-mod-row";
import { RebuildBanner } from "@/components/rebuild-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useInstalledMods } from "@/hooks/use-installed-mods";
import { useModInstaller } from "@/hooks/use-mod-installer";
import { modRegistry } from "@/lib/mod-registry";
import type { InstalledMod } from "@/lib/mod-storage";

function SortableInstalledMod({
  installedMod,
  onToggle,
}: {
  installedMod: InstalledMod;
  onToggle: (enabled: boolean) => void;
}) {
  const entry = modRegistry.find((candidate) => candidate.id === installedMod.id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: installedMod.id,
  });

  if (!entry) {
    return null;
  }

  return (
    <InstalledModRow
      attributes={attributes}
      entry={entry}
      installedMod={installedMod}
      isDragging={isDragging}
      listeners={listeners}
      setNodeRef={setNodeRef}
      transform={transform}
      transition={transition}
      onToggle={onToggle}
    />
  );
}

export default function InstalledModsPage() {
  const { state, isLoading, rebuildNeeded, refresh, toggleMod, reorderMods } = useInstalledMods();
  const installer = useModInstaller();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const installedMods = [...(state?.installed ?? [])].sort((a, b) => a.order - b.order);
  const installedIds = installedMods.map((mod) => mod.id);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = installedIds.indexOf(String(active.id));
    const newIndex = installedIds.indexOf(String(over.id));

    if (oldIndex === -1 || newIndex === -1) {
      return;
    }

    await reorderMods(arrayMove(installedIds, oldIndex, newIndex));
  }

  async function handleLovelyDump(fileList: FileList | null) {
    const file = fileList?.item(0);

    if (!file) {
      return;
    }

    await installer.importLovelyDump(file);
    await refresh();
  }

  async function handleRebuild() {
    setIsRebuilding(true);

    try {
      await installer.rebuild();
      await refresh();
    } finally {
      setIsRebuilding(false);
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Button asChild variant="ghost">
            <Link href="/library/balatro/mods">
              <ArrowLeft className="h-4 w-4" />
              Mod browser
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/play/balatro">Play</Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
        <section className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground">Balatro mods</p>
            <h1 className="mt-2 text-3xl font-medium tracking-[-0.03em]">Installed</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Enable mods, reorder their load order, import a Lovely Dump for experimental SMODS mods, then rebuild the
              browser version.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="/library/balatro/mods">
                <Plus className="h-4 w-4" />
                Add mods
              </Link>
            </Button>
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              <FolderInput className="h-4 w-4" />
              Import Lovely Dump
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(event) => void handleLovelyDump(event.currentTarget.files)}
            />
            <Button disabled={isRebuilding || isLoading} onClick={handleRebuild}>
              <Download className="h-4 w-4" />
              Rebuild
            </Button>
          </div>
        </section>

        {rebuildNeeded ? <RebuildBanner onRebuild={handleRebuild} isRebuilding={isRebuilding} /> : null}

        {installer.progress.status !== "idle" ? (
          <Card>
            <CardContent className="space-y-3 p-4">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-muted-foreground">
                  {installer.runtimeStatus === "building" ? installer.runtimeProgress.label : installer.progress.label}
                </span>
                <span className="font-medium">
                  {Math.round(installer.runtimeStatus === "building" ? installer.runtimeProgress.value : installer.progress.value)}%
                </span>
              </div>
              <Progress value={installer.runtimeStatus === "building" ? installer.runtimeProgress.value : installer.progress.value} />
              {installer.error ? <p className="text-sm text-muted-foreground">{installer.error}</p> : null}
            </CardContent>
          </Card>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Load order</CardTitle>
            <CardDescription>
              Mods are passed to web-balatro in this order. Disabled mods stay installed but are skipped on rebuild.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {state?.lovelyDump ? (
              <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Lovely Dump imported from {state.lovelyDump.fileName}. Experimental mods are unlocked.
              </div>
            ) : (
              <div className="mb-4 rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                Import a Lovely Dump zip to unlock experimental SMODS mods. Lobby will include it as the existing web-balatro
                &quot;Dump from Lovely&quot; path during rebuilds.
              </div>
            )}

            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading installed mods.</p>
            ) : installedMods.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-8 text-center">
                <p className="text-sm font-medium">No mods installed</p>
                <p className="mt-2 text-sm text-muted-foreground">Install a verified mod from the browser to get started.</p>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={installedIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-3">
                    {installedMods.map((installedMod) => (
                      <SortableInstalledMod
                        key={installedMod.id}
                        installedMod={installedMod}
                        onToggle={(enabled) => void toggleMod(installedMod.id, enabled)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
