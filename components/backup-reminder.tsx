"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { exportLobbyBackup } from "@/lib/backup";
import { readPreferences, updatePreferences, type LobbyPreferences } from "@/lib/preferences";

function shouldShowReminder(preferences: LobbyPreferences) {
  return preferences.launchCount >= 10 && preferences.launchCount - preferences.lastBackupReminderLaunchCount >= 10;
}

export function BackupReminder() {
  const [preferences, setPreferences] = useState<LobbyPreferences | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);

  const refresh = useCallback(async () => {
    const nextPreferences = await readPreferences();
    setPreferences(nextPreferences);
  }, []);

  useEffect(() => {
    refresh().catch(() => {
      setPreferences(null);
    });
  }, [refresh]);

  async function dismiss() {
    if (!preferences) {
      return;
    }

    const nextPreferences = await updatePreferences((currentPreferences) => ({
      ...currentPreferences,
      lastBackupReminderLaunchCount: currentPreferences.launchCount,
    }));
    setPreferences(nextPreferences);
  }

  async function backUpNow() {
    setIsBackingUp(true);

    try {
      await exportLobbyBackup();
      const nextPreferences = await updatePreferences((currentPreferences) => ({
        ...currentPreferences,
        lastBackupAt: Date.now(),
        lastBackupReminderLaunchCount: currentPreferences.launchCount,
      }));
      setPreferences(nextPreferences);
    } finally {
      setIsBackingUp(false);
    }
  }

  if (!preferences || !shouldShowReminder(preferences)) {
    return null;
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium">It has been a while. Back up your saves?</p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Lobby has launched Balatro {preferences.launchCount} times on this browser.
        </p>
      </div>
      <div className="flex gap-2">
        <Button disabled={isBackingUp} onClick={backUpNow}>
          {isBackingUp ? "Backing up" : "Back up now"}
        </Button>
        <Button variant="secondary" onClick={dismiss}>
          Remind me later
        </Button>
      </div>
    </div>
  );
}
