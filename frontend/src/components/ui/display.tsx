import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE: Record<Size, string> = {
  sm: "text-[28px] leading-[1.05]",
  md: "text-[34px] leading-[1.04]",
  lg: "text-[42px] leading-[1.02]",
  xl: "text-[56px] leading-none",
};

interface DisplayProps extends ComponentProps<"h1"> {
  size?: Size;
}

export function Display({ size = "md", className, ...props }: DisplayProps) {
  return (
    <h1
      className={cn(
        "serif font-normal tracking-[-0.015em] text-text",
        SIZE[size],
        className
      )}
      {...props}
    />
  );
}
