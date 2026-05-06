import type { LucideIcon } from "lucide-react";
import { Circle, Gamepad2, Lock, Spade } from "lucide-react";

export type CatalogGameStatus = "ready" | "setup-needed" | "locked";

export type CatalogGame = {
  id: string;
  title: string;
  author: string;
  status: CatalogGameStatus;
  icon: LucideIcon;
};

export const gameCatalog: CatalogGame[] = [
  {
    id: "balatro",
    title: "Balatro",
    author: "LocalThunk",
    status: "setup-needed",
    icon: Spade,
  },
  {
    id: "mari0",
    title: "Mari0",
    author: "Stabyourself.net",
    status: "locked",
    icon: Gamepad2,
  },
  {
    id: "move-or-die",
    title: "Move or die",
    author: "Those Awesome Guys",
    status: "locked",
    icon: Circle,
  },
  {
    id: "future-love",
    title: "Another LOVE game",
    author: "Coming soon",
    status: "locked",
    icon: Lock,
  },
];
