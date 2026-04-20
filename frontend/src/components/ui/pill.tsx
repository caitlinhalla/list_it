import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Tone = "default" | "accent" | "ghost" | "dark";

const TONE: Record<Tone, string> = {
  default: "bg-surface text-text-2 border-border",
  accent:  "bg-accent-wash text-accent-ink border-transparent",
  ghost:   "bg-transparent text-text-3 border-border",
  dark:    "bg-ink text-paper border-ink",
};

interface PillProps extends ComponentProps<"span"> {
  tone?: Tone;
}

export function Pill({ tone = "default", className, ...props }: PillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11.5px] font-medium tracking-[-0.01em]",
        TONE[tone],
        className
      )}
      {...props}
    />
  );
}
