import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AVRENYX — One Workspace. Every AI. Every Creation.",
  description:
    "Personal-use-first, strictly free-first, subscription-free, multi-AI operating workspace with capability-based routing, durable checkpoints, automatic provider fallback, deep research, and document pipelines.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
