import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@multica/ui/components/ui/sonner";
import { cn } from "@multica/ui/lib/utils";
import { WebProviders } from "@/components/web-providers";
import { LocaleSync } from "@/components/locale-sync";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#05070b" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://openagent.run"),
  title: {
    default: "Harness — Agent Delivery OS",
    template: "%s",
  },
  description:
    "Open-source operating system for planning work, routing execution, and governing delivery across human teams and AI agents.",
  icons: {
    icon: [{ url: "/images/agent_harness_favicon.ico", type: "image/x-icon" }],
    shortcut: ["/images/agent_harness_favicon.ico"],
  },
  openGraph: {
    type: "website",
    siteName: "Harness",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
  },
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased font-sans h-full", geist.variable, geistMono.variable)}
    >
      <body className="h-full overflow-hidden">
        <LocaleSync />
        <ThemeProvider>
          <WebProviders>
            {children}
          </WebProviders>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
