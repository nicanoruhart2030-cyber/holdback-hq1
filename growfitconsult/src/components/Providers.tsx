"use client";

import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import type { ReactNode } from "react";
import { I18nProvider } from "@/lib/i18n/context";

/**
 * LazyMotion keeps the animation bundle small (only the DOM features we use).
 * reducedMotion="user" drops transforms for visitors who ask for less motion,
 * keeping opacity fades so content still arrives gently.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user" transition={{ ease: [0.23, 1, 0.32, 1] }}>
          {children}
        </MotionConfig>
      </LazyMotion>
    </I18nProvider>
  );
}
