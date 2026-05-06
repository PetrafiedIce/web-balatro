import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";

import { GameCanvasHost } from "@/components/game-canvas-host";
import { PersistenceProvider } from "@/components/persistence-provider";
import { RunningGamePill } from "@/components/running-game-pill";
import { ThemeProvider } from "@/components/theme-provider";
import { GameSessionProvider } from "@/contexts/game-session-context";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Lobby",
  description: "A clean launcher for browser-playable LOVE games.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} min-h-screen bg-background font-sans text-foreground antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
          <PersistenceProvider>
            <GameSessionProvider>
              {children}
              <GameCanvasHost />
              <RunningGamePill />
            </GameSessionProvider>
          </PersistenceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
