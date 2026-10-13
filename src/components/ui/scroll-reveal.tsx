"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ScrollRevealProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  /** Visual motion variant: "fade-up" shifts 10px upward; "fade-only" performs opacity transition without transform */
  variant?: "fade-up" | "fade-only";
  /** Optional index to calculate automatic 50ms stagger delays (capped at 500ms max) */
  staggerIndex?: number;
  /** Specific delay in milliseconds if not using staggerIndex */
  delayMs?: number;
  /** Custom root element (defaults to "div") */
  as?: React.ElementType;
}

export function ScrollReveal({
  children,
  variant = "fade-up",
  staggerIndex,
  delayMs,
  className,
  as: Component = "div",
  style,
  ...props
}: ScrollRevealProps) {
  const ref = React.useRef<HTMLElement | null>(null);

  const computedDelay = React.useMemo(() => {
    if (typeof delayMs === "number") return delayMs;
    if (typeof staggerIndex === "number") return Math.min(staggerIndex * 50, 500);
    return 0;
  }, [delayMs, staggerIndex]);

  React.useEffect(() => {
    // 1. Accessibility: strictly respect prefers-reduced-motion at mount
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const element = ref.current;
    if (!element) return;

    // 2. Prevent flash on initial paint: if already within or above the viewport, stay visible
    const rect = element.getBoundingClientRect();
    const isAboveOrInView = rect.top < window.innerHeight && rect.bottom > 0;
    if (isAboveOrInView) {
      return;
    }

    // 3. For offscreen elements below the viewport, mark ready for reveal while out of sight
    element.dataset.revealReady = "true";

    // 4. Single-run IntersectionObserver: plays once only, unobserves upon first reveal
    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          element.dataset.revealed = "true";
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <Component
      ref={ref}
      data-variant={variant}
      className={cn(className)}
      style={{
        ...style,
        ["--reveal-delay" as string]: `${computedDelay}ms`,
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
