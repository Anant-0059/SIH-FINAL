import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Delhi NCR Air Quality Intelligence Dashboard",
  description: "Real-time air-quality monitoring, historical CPCB analysis, and machine-learning multi-horizon AQI forecast.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-200">{children}</body>
    </html>
  );
}
