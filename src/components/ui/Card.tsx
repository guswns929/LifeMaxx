"use client";

import type { ReactNode } from "react";

interface CardProps {
  title?: string;
  description?: string;
  padding?: boolean;
  className?: string;
  children: ReactNode;
}

export default function Card({
  title,
  description,
  padding = true,
  className = "",
  children,
}: CardProps) {
  return (
    <div
      className={[
        "bg-surface border border-border rounded-xl shadow-sm",
        className,
      ].join(" ")}
    >
      {(title || description) && (
        <div className="px-6 pt-6 pb-0">
          {title && (
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
          )}
          {description && (
            <p className="mt-1 text-sm text-text-muted">{description}</p>
          )}
        </div>
      )}
      <div className={padding ? "p-6" : ""}>{children}</div>
    </div>
  );
}
