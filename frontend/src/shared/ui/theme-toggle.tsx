"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

import { Button } from "./button";
import themeConfig from "@/config/theme.json";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const current = resolvedTheme || themeConfig.defaultTheme || "light";
  const isDark = current === "dark";
  const next = isDark ? "light" : "dark";

  // Only allow themes defined in config; fallback to light/dark.
  const allowedThemes = themeConfig.themes ?? ["light", "dark"];
  const nextTheme = allowedThemes.includes(next) ? next : "light";

  const labels = themeConfig.labels ?? { light: "Daylight", dark: "Dark" };

  if (!mounted) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      className="border border-border/70 bg-card/70 backdrop-blur-md shadow-sm hover:-translate-y-0.5 transition"
      title={isDark ? labels.light ?? "Daylight" : labels.dark ?? "Dark"}
      onClick={() => setTheme(nextTheme)}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
