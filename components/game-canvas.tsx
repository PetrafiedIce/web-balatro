"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

type GameCanvasProps = React.CanvasHTMLAttributes<HTMLCanvasElement>;

export const GameCanvas = React.forwardRef<HTMLCanvasElement, GameCanvasProps>(({ className, ...props }, ref) => {
  return (
    <canvas
      id="canvas"
      ref={ref}
      tabIndex={0}
      className={cn("h-full w-full bg-black", className)}
      {...props}
    />
  );
});

GameCanvas.displayName = "GameCanvas";
