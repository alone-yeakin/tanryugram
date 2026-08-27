import { Check, ShieldCheck, Sparkles, Trophy, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeType = "none" | "blue" | "black" | "gold" | "vip" | "founder" | "legend";

export function ProfileBadge({ type, className }: { type: BadgeType; className?: string }) {
  if (type === "none") return null;

  const config = {
    blue: { icon: Check, color: "bg-blue-500 text-white", label: "Verified" },
    black: { icon: ShieldCheck, color: "bg-black text-white", label: "Member" },
    gold: { icon: Sparkles, color: "bg-amber-400 text-amber-950", label: "Gold" },
    vip: { icon: Crown, color: "bg-violet-600 text-white", label: "VIP" },
    founder: { icon: Trophy, color: "bg-rose-500 text-white", label: "Founder" },
    legend: { icon: Star, color: "bg-sky-400 text-sky-950", label: "Legend" },
  }[type];

  if (!config) return null;
  const Icon = config.icon;

  return (
    <div className={cn("inline-flex h-4 w-4 items-center justify-center rounded-full shadow-sm", config.color, className)} title={config.label}>
      <Icon className="h-2.5 w-2.5" strokeWidth={3} />
    </div>
  );
}
