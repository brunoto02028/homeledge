import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AppShell } from "@/components/header"
import { CookieBanner } from "@/components/cookie-banner"

const inter = Inter({ subsets: ["latin"], display: "swap" })

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e293b" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://homeledger.co.uk"),
  title: {
    default: "HomeLedger — Simplify Your UK Finances",
    template: "%s — HomeLedger",
  },
  description: "Manage bank statements, invoices, HMRC tax reports, bills, and more. Free UK personal and business finance platform with AI-powered tools.",
  keywords: ["UK finance", "personal finance", "HMRC tax", "self assessment", "invoice management", "bank statements", "bill tracker", "financial projections", "HomeLedger"],
  authors: [{ name: "HomeLedger" }],
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://homeledger.co.uk",
    siteName: "HomeLedger",
    title: "HomeLedger — Simplify Your UK Finances",
    description: "The all-in-one UK finance platform for individuals and small businesses. Bank statements, invoices, tax reports, secure vault, and AI tools.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "HomeLedger" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "HomeLedger — Simplify Your UK Finances",
    description: "The all-in-one UK finance platform for individuals and small businesses.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "HomeLedger",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script src="https://apps.abacus.ai/chatllm/appllm-lib.js"></script>
        <style>{`[data-hydration-error] { display: none !important; }`}</style>
      </head>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <Providers>
          <AppShell>
            {children}
          </AppShell>
          <CookieBanner />
        </Providers>
      </body>
    </html>
  )
}
