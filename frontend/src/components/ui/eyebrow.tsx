import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Eyebrow({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] text-text-3",
        className
      )}
      {...props}
    />
  );
}
