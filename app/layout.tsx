import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Syne } from "next/font/google";
import { AppShellGate } from "@/components/AppShellGate";
import { ThemeProvider } from "@/components/ThemeProvider";
import { THEME_BOOT_SCRIPT } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "CineSwipe",
  applicationName: "CineSwipe",
  description: "Discover movies matched to your taste",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CineSwipe",
  },
};

export const viewport: Viewport = {
  themeColor: "#fafafa",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-ui-mode="minimal"
      data-theme="dark-midnight"
      data-theme-family="dark"
      className={`${geistSans.variable} ${geistMono.variable} ${syne.variable} h-full overflow-hidden antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background text-foreground">
        <ThemeProvider>
          <AppShellGate>{children}</AppShellGate>
        </ThemeProvider>
      </body>
    </html>
  );
}
