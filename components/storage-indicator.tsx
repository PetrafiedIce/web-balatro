"use client";

import { Database } from "lucide-react";

import { formatBytes, type StorageEstimate, usePersistentStorage } from "@/hooks/use-persistent-storage";
import { cn } from "@/lib/utils";

type StorageIndicatorProps = {
  estimate?: StorageEstimate;
  isLoading?: boolean;
  className?: string;
};

export function StorageIndicator({ estimate, isLoading = false, className }: StorageIndicatorProps) {
  const storage = usePersistentStorage();
  const resolvedEstimate = estimate ?? storage.estimate;
  const resolvedLoading = isLoading || storage.isLoading;
  const used = formatBytes(resolvedEstimate.usage);
  const quota = resolvedEstimate.quota > 0 ? formatBytes(resolvedEstimate.quota) : "unknown quota";

  return (
    <div className={cn("flex items-center gap-2 text-sm text-muted-foreground", className)}>
      <Database className="h-4 w-4" aria-hidden="true" />
      <span>{resolvedLoading ? "Checking storage." : `Used: ${used} of ~${quota} available`}</span>
      {resolvedEstimate.persisted ? <span className="text-foreground">Persistent</span> : null}
    </div>
  );
}
