import type { ReactNode } from "react";
import "../src/styles/index.css";

export const metadata = {
  title: "FinDash Cash Flow Tracker",
  description: "Cash flow management dashboard",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
