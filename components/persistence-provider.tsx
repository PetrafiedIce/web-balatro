"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";

import { usePersistentStorage } from "@/hooks/use-persistent-storage";

export function PersistenceProvider({ children }: { children: ReactNode }) {
  const { dismissSecuredToast, showSecuredToast } = usePersistentStorage({ requestPersistence: true });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!showSecuredToast) {
      return;
    }

    setIsVisible(true);
    const timer = window.setTimeout(() => {
      setIsVisible(false);
      dismissSecuredToast();
    }, 4200);

    return () => window.clearTimeout(timer);
  }, [dismissSecuredToast, showSecuredToast]);

  return (
    <>
      {children}
      {showSecuredToast && isVisible ? (
        <div className="fixed bottom-5 left-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 rounded-xl border border-border bg-card p-4 text-sm text-foreground">
          Storage secured - your saves and mods will persist.
        </div>
      ) : null}
    </>
  );
}
