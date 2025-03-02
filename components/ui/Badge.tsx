import { cn } from "@/lib/utils";
import { ReactNode, forwardRef } from "react";


export type BadgeVariant = "default" | "outline" | "success" | "destructive" | "warning" | "info";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "default", children, className, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
          {
            "bg-blue-100 text-blue-800": variant === "default",
            "bg-transparent border border-gray-300 text-gray-700": variant === "outline",
            "bg-green-100 text-green-800": variant === "success",
            "bg-red-100 text-red-800": variant === "destructive",
            "bg-yellow-100 text-yellow-800": variant === "warning",
            "bg-cyan-100 text-cyan-800": variant === "info",
          },
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
