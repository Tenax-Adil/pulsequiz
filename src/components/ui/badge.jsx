import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-zinc-100 text-zinc-900 shadow-sm",
        secondary:
          "border-zinc-800 bg-zinc-900 text-zinc-300",
        destructive:
          "border-red-900/50 bg-red-950/50 text-red-400",
        outline:
          "border-zinc-800 text-zinc-400",
        success:
          "border-emerald-900/50 bg-emerald-950/40 text-emerald-400",
        indigo:
          "border-indigo-900/50 bg-indigo-950/40 text-indigo-300",
        amber:
          "border-amber-900/50 bg-amber-950/40 text-amber-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
