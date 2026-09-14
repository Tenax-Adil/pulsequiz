import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils.js";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950 disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-zinc-100 text-zinc-900 shadow-sm hover:bg-zinc-200 font-semibold",
        destructive:
          "bg-red-900/40 text-red-300 border border-red-800/50 hover:bg-red-900/60 shadow-sm",
        outline:
          "border border-zinc-800 bg-zinc-900/50 text-zinc-200 hover:bg-zinc-800 hover:text-white hover:border-zinc-700",
        secondary:
          "bg-zinc-800 text-zinc-100 hover:bg-zinc-700/80 border border-zinc-700/50",
        ghost:
          "text-zinc-400 hover:bg-zinc-850 hover:text-zinc-100 hover:bg-zinc-800/60",
        link:
          "text-indigo-400 underline-offset-4 hover:underline",
        accent:
          "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500 font-semibold border border-indigo-500/50",
        emerald:
          "bg-emerald-600 text-white shadow-sm hover:bg-emerald-500 font-semibold border border-emerald-500/50",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-11 rounded-xl px-6 text-base font-semibold",
        icon: "h-9 w-9 p-0 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
