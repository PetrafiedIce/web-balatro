"use client";

import { UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { useBalatroRuntime } from "@/hooks/use-balatro-runtime";
import { cn } from "@/lib/utils";

type SetupDropzoneProps = {
  disabled?: boolean;
  onFile: (file: File) => Promise<void>;
  progress: ReturnType<typeof useBalatroRuntime>["progress"];
  status: ReturnType<typeof useBalatroRuntime>["status"];
};

export function SetupDropzone({ disabled = false, onFile, progress, status }: SetupDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const isBuilding = status === "building";
  const isDisabled = disabled || isBuilding;

  async function handleFiles(fileList: FileList | null) {
    const file = fileList?.item(0);

    if (!file || isDisabled) {
      return;
    }

    await onFile(file);
  }

  return (
    <div className="space-y-4">
        <button
          type="button"
          disabled={isDisabled}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(event) => {
            event.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleFiles(event.dataTransfer.files);
          }}
          className={cn(
            "flex min-h-48 w-full flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 px-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20 disabled:cursor-not-allowed disabled:opacity-60",
            isDragging && "border-foreground bg-muted",
          )}
        >
          <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card">
            <UploadCloud className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-medium text-foreground">Drop Balatro.exe here</span>
          <span className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            You can also choose a local .exe, .love, or .zip file. Lobby extracts and patches it in this browser.
          </span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".exe,.love,.zip,application/zip"
          className="hidden"
          disabled={isDisabled}
          onChange={(event) => void handleFiles(event.currentTarget.files)}
        />
        {isBuilding ? (
          <div className="space-y-2 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">{progress.label}</span>
              <span className="font-medium text-foreground">{Math.round(progress.value)}%</span>
            </div>
            <Progress value={progress.value} />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
            <span>Balatro will be cached in IndexedDB as vanilla.</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => inputRef.current?.click()}>
              Choose file
            </Button>
          </div>
        )}
    </div>
  );
}
