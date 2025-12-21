"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import themeConfig from "@/config/theme.json";

export function Providers({ children }: { children: ReactNode }) {
  const defaultTheme = themeConfig.defaultTheme ?? "system";
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem={themeConfig.themes?.includes("system") || defaultTheme === "system"}
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
}
