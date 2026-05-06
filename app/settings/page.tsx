"use client";

import { Download, RotateCcw, Upload } from "lucide-react";
import { useRef, useState } from "react";

import { Nav } from "@/components/nav";
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
import { usePersistentStorage } from "@/hooks/use-persistent-storage";
import { exportLobbyBackup, importLobbyBackup } from "@/lib/backup";
import { readPreferences, writePreferences } from "@/lib/preferences";

type RestoreState = {
  file: File | null;
  isOpen: boolean;
};

export default function SettingsPage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { estimate, refreshEstimate } = usePersistentStorage();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [restoreState, setRestoreState] = useState<RestoreState>({ file: null, isOpen: false });

  async function handleBackup() {
    setIsBusy(true);
    setError(null);

    try {
      await exportLobbyBackup();
      const preferences = await readPreferences();
      await writePreferences({
        ...preferences,
        lastBackupAt: Date.now(),
        lastBackupReminderLaunchCount: preferences.launchCount,
      });
      await refreshEstimate();
      setMessage("Backup downloaded.");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setIsBusy(false);
    }
  }

  async function handleRestore() {
    if (!restoreState.file) {
      return;
    }

    setIsBusy(true);
    setError(null);

    try {
      await importLobbyBackup(restoreState.file);
      await refreshEstimate();
      setRestoreState({ file: null, isOpen: false });
      setMessage("Backup restored. Reload Lobby before launching Balatro.");
    } catch (unknownError) {
      setError(unknownError instanceof Error ? unknownError.message : String(unknownError));
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
        <section className="space-y-2">
          <p className="text-xs font-medium tracking-[0.22em] text-muted-foreground">Lobby</p>
          <h1 className="text-3xl font-medium tracking-[-0.03em]">Settings</h1>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage local storage, backup saves, and restore everything Lobby needs to rebuild and launch Balatro.
          </p>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Local storage</CardTitle>
            <CardDescription>
              Lobby asks the browser for persistent storage so built versions, saves, mods, and preferences are not evicted
              under storage pressure.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <StorageIndicator />
            <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
              Persistence status: {estimate.persisted ? "secured" : "not guaranteed by this browser yet"}.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backup and restore</CardTitle>
            <CardDescription>
              Backups include built Balatro versions, per-version save databases, installed mods, Lovely Dump imports, and
              Lobby preferences.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button disabled={isBusy} onClick={handleBackup}>
                <Download className="h-4 w-4" />
                Backup data
              </Button>
              <Button disabled={isBusy} variant="outline" onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" />
                Restore from backup
              </Button>
              <Button variant="ghost" onClick={() => void refreshEstimate()}>
                <RotateCcw className="h-4 w-4" />
                Refresh storage
              </Button>
            </div>
            <input
              ref={inputRef}
              type="file"
              accept=".zip,application/zip"
              className="hidden"
              onChange={(event) => {
                const file = event.currentTarget.files?.item(0);

                if (file) {
                  setRestoreState({ file, isOpen: true });
                }

                event.currentTarget.value = "";
              }}
            />
            {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
            {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
          </CardContent>
        </Card>
      </main>

      <Dialog
        open={restoreState.isOpen}
        onOpenChange={(isOpen) => setRestoreState((current) => ({ ...current, isOpen }))}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Restore backup?</DialogTitle>
            <DialogDescription>
              Restoring this backup overwrites current built versions, save data, installed mods, Lovely Dump imports, and
              Lobby preferences in this browser.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex gap-2">
            <Button disabled={isBusy} onClick={handleRestore}>
              Restore backup
            </Button>
            <Button
              disabled={isBusy}
              variant="secondary"
              onClick={() => setRestoreState({ file: null, isOpen: false })}
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
