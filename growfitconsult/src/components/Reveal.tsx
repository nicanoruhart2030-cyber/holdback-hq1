"use client";

import { m } from "framer-motion";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  /** seconds */
  delay?: number;
  /** travel in px; headings travel further than supporting text */
  y?: number;
  as?: "div" | "li" | "section" | "header";
};

/**
 * Fades content up once as it enters the viewport. Opacity starts at 0.001
 * rather than 0 so the element still counts for paint metrics.
 */
export function Reveal({ children, className, delay = 0, y = 16, as = "div" }: Props) {
  const Comp = m[as];
  return (
    <Comp
      className={className}
      initial={{ opacity: 0.001, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Shrinking gaps read as one wave instead of a queue. */
export const stagger = (i: number) => [0, 0.08, 0.14, 0.19, 0.23, 0.26][Math.min(i, 5)] ?? 0.26;
