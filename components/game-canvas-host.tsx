"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { GameCanvas } from "@/components/game-canvas";
import { useGameSession } from "@/contexts/game-session-context";
import { cn } from "@/lib/utils";

export function GameCanvasHost() {
  const pathname = usePathname();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { activeGame, registerCanvas } = useGameSession();
  const isVisible = pathname === "/play/balatro" && activeGame === "balatro";

  useEffect(() => {
    registerCanvas(canvasRef.current);
    return () => registerCanvas(null);
  }, [registerCanvas]);

  return (
    <div
      aria-hidden={!isVisible}
      className={cn(
        "fixed inset-x-0 bottom-0 top-14 z-0 bg-black transition-transform duration-200",
        isVisible ? "translate-x-0" : "translate-x-[-200vw]",
      )}
    >
      <GameCanvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
