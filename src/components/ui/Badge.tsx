"use client";

import type { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "bg-green-900/30 text-green-400 ring-green-600/20",
  warning: "bg-yellow-900/30 text-yellow-400 ring-yellow-600/20",
  danger: "bg-red-900/30 text-red-400 ring-red-600/20",
  info: "bg-blue-900/30 text-blue-400 ring-blue-600/20",
  neutral: "bg-surface-raised text-text-secondary ring-stone-500/20",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function Badge({
  variant = "neutral",
  size = "md",
  className = "",
  children,
}: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex items-center font-medium rounded-full ring-1 ring-inset",
        variantStyles[variant],
        sizeStyles[size],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
