import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Podcast Clip Engine",
  description: "Find podcast hooks and switch the vertical camera to the active speaker. Backgrounds are drawn in the browser.",
};

export const viewport: Viewport = {
  themeColor: "#071014",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
