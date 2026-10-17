import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BottomNav } from "@/components/BottomNav";
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

export const metadata: Metadata = {
  title: "CineSwipe",
  applicationName: "CineSwipe",
  description: "Discover movies matched to your IMDb taste",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "CineSwipe",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
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
      data-theme="dark-midnight"
      data-theme-family="dark"
      className={`${geistSans.variable} ${geistMono.variable} h-full overflow-hidden antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-background text-foreground">
        <ThemeProvider>
          <header className="app-header z-40 shrink-0 border-b px-4 py-3 backdrop-blur-xl">
            <div className="mx-auto max-w-lg">
              <h1 className="text-lg font-bold leading-none">
                <span className="font-normal text-accent-text">Cine</span>
                Swipe
              </h1>
            </div>
          </header>
          <main className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-y-auto overflow-x-hidden">
            {children}
          </main>
          <BottomNav />
        </ThemeProvider>
      </body>
    </html>
  );
}
