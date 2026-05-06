"use client";

import { useEffect, useMemo, useState } from "react";

import { BackupReminder } from "@/components/backup-reminder";
import { GameCard } from "@/components/game-card";
import { Nav } from "@/components/nav";
import { SetupDropzone } from "@/components/setup-dropzone";
import { StorageIndicator } from "@/components/storage-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBalatroRuntime } from "@/hooks/use-balatro-runtime";
import { gameCatalog, type CatalogGameStatus } from "@/lib/game-catalog";

export default function LibraryPage() {
  const { buildFromFile, clearError, error, hasCachedVersion, progress, status } = useBalatroRuntime();
  const [hasBalatro, setHasBalatro] = useState<boolean | null>(null);
  const balatroStatus: CatalogGameStatus = hasBalatro ? "ready" : "setup-needed";

  useEffect(() => {
    let cancelled = false;

    hasCachedVersion()
      .then((hasCachedVersion) => {
        if (!cancelled) {
          setHasBalatro(hasCachedVersion);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasBalatro(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [hasCachedVersion]);

  const games = useMemo(
    () =>
      gameCatalog.map((game) =>
        game.id === "balatro"
          ? {
              ...game,
              status: balatroStatus,
            }
          : game,
      ),
    [balatroStatus],
  );

  async function handleBuild(file: File) {
    await buildFromFile(file);
    setHasBalatro(await hasCachedVersion());
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10">
        <BackupReminder />

        <section className="flex flex-col gap-2">
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground">Your library</p>
          <h1 className="text-3xl font-medium tracking-[-0.03em] text-foreground">Games</h1>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          {games.map((game) => (
            <GameCard
              key={game.id}
              author={game.author}
              icon={game.icon}
              isChecking={game.id === "balatro" && hasBalatro === null}
              launchHref={game.id === "balatro" && hasBalatro ? "/play/balatro" : undefined}
              modsHref={game.id === "balatro" ? "/library/balatro/mods" : undefined}
              onSetupClick={
                game.id === "balatro" && !hasBalatro
                  ? () => document.getElementById("balatro-setup")?.scrollIntoView({ behavior: "smooth" })
                  : undefined
              }
              status={game.status}
              title={game.title}
            />
          ))}
        </section>

        {!hasBalatro ? (
          <Card id="balatro-setup" className="scroll-mt-6">
            <CardHeader>
              <CardTitle>Set up Balatro</CardTitle>
              <CardDescription>
                Your file never leaves this device. It runs locally in your browser and caches in IndexedDB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SetupDropzone
                disabled={status === "building"}
                onFile={handleBuild}
                progress={progress}
                status={status}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Balatro is ready</CardTitle>
              <CardDescription>
                The built version is cached in this browser as vanilla, including separate IndexedDB save storage.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <a href="/play/balatro">Launch</a>
              </Button>
            </CardContent>
          </Card>
        )}

        <footer className="flex justify-end">
          <StorageIndicator />
        </footer>
      </main>

      <Dialog open={status === "error" && Boolean(error)} onOpenChange={clearError}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Balatro could not be set up</DialogTitle>
            <DialogDescription>{error}</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
