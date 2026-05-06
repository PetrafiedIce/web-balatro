"use client";

import { Badge } from "@/components/ui/badge";
import type { ModEntry } from "@/lib/mod-registry";

type CompatBadgeProps = {
  tier: ModEntry["tier"];
};

const labels: Record<ModEntry["tier"], string> = {
  verified: "Verified",
  experimental: "Experimental",
  incompatible: "Incompatible",
};

export function CompatBadge({ tier }: CompatBadgeProps) {
  const tone = tier === "verified" ? "success" : tier === "experimental" ? "warning" : "muted";

  return <Badge tone={tone}>{labels[tier]}</Badge>;
}
