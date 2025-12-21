import type { ReactNode } from "react";
import "../src/styles/index.css";
import { Providers } from "@/app/providers";

export const metadata = {
  title: "FinDash Cash Flow Tracker",
  description: "Cash flow management dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
