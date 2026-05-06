export type ModEntry = {
  id: string;
  name: string;
  author: string;
  description: string;
  category: "qol" | "content" | "cosmetic" | "gameplay" | "utility";
  tier: "verified" | "experimental" | "incompatible";
  requiresSmods: boolean;
  requiresLovelyDump: boolean;
  tags: string[];
  source: string;
  downloadUrl: string;
  thumbnail?: string;
  version: string;
  autoPatch: { fixQuadQuotes: boolean };
};

export const modRegistry: ModEntry[] = [
  {
    id: "handy",
    name: "Handy",
    author: "SleepyG11",
    description:
      "A quality-of-life helper mod for Balatro. Handy is listed by web-balatro as a working mod and does not require SMODS.",
    category: "qol",
    tier: "verified",
    requiresSmods: false,
    requiresLovelyDump: false,
    tags: ["quality of life", "controls", "verified"],
    source: "https://github.com/SleepyG11/HandyBalatro",
    downloadUrl: "https://github.com/SleepyG11/HandyBalatro/archive/refs/heads/main.zip",
    version: "main",
    autoPatch: { fixQuadQuotes: true },
  },
  // VERIFY: untested placeholder. Keep disabled until confirmed against web-balatro.
  {
    id: "cryptid",
    name: "Cryptid",
    author: "Cryptid team",
    description:
      "A large content mod with new cards and mechanics. It is shown for planning only until a Lovely Dump path is verified.",
    category: "content",
    tier: "experimental",
    requiresSmods: true,
    requiresLovelyDump: true,
    tags: ["content", "SMODS", "experimental"],
    source: "https://github.com/SpectralPack/Cryptid",
    downloadUrl: "https://github.com/SpectralPack/Cryptid/archive/refs/heads/main.zip",
    version: "unverified",
    autoPatch: { fixQuadQuotes: true },
  },
  // VERIFY: untested placeholder. Keep disabled until confirmed against web-balatro.
  {
    id: "talisman",
    name: "Talisman",
    author: "MathIsFun",
    description:
      "Utility support for larger-number Balatro mods. It likely requires SMODS and a Lovely Dump for browser experiments.",
    category: "utility",
    tier: "experimental",
    requiresSmods: true,
    requiresLovelyDump: true,
    tags: ["utility", "SMODS", "numbers"],
    source: "https://github.com/MathIsFun0/Talisman",
    downloadUrl: "https://github.com/MathIsFun0/Talisman/archive/refs/heads/main.zip",
    version: "unverified",
    autoPatch: { fixQuadQuotes: true },
  },
  // VERIFY: untested placeholder. Keep disabled until confirmed against web-balatro.
  {
    id: "paperback",
    name: "Paperback",
    author: "Paperback team",
    description:
      "A content pack placeholder for the curated catalog. Compatibility has not been validated in the browser runtime.",
    category: "content",
    tier: "incompatible",
    requiresSmods: true,
    requiresLovelyDump: true,
    tags: ["content", "SMODS", "unverified"],
    source: "https://github.com/Balatro-Paperback/paperback",
    downloadUrl: "https://github.com/Balatro-Paperback/paperback/archive/refs/heads/main.zip",
    version: "unverified",
    autoPatch: { fixQuadQuotes: true },
  },
  // VERIFY: untested placeholder. Keep disabled until confirmed against web-balatro.
  {
    id: "texture-pack-example",
    name: "Texture pack example",
    author: "Community",
    description:
      "A cosmetic placeholder entry showing how curated, non-code mods can appear once their browser package is verified.",
    category: "cosmetic",
    tier: "incompatible",
    requiresSmods: false,
    requiresLovelyDump: false,
    tags: ["cosmetic", "placeholder"],
    source: "https://github.com/",
    downloadUrl: "https://github.com/",
    version: "unverified",
    autoPatch: { fixQuadQuotes: true },
  },
];

export const modCategories = ["qol", "content", "cosmetic", "gameplay", "utility"] as const;
export const modTiers = ["verified", "experimental", "incompatible"] as const;
