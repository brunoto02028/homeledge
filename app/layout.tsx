import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AppShell } from "@/components/header"
import { CookieBanner } from "@/components/cookie-banner"
import { SiteTracker } from "@/components/site-tracker"
import { AnalyticsTracker } from "@/components/analytics-tracker"
import UserTracker from "@/components/user-tracker"
import InvisibleWatermark from "@/components/invisible-watermark"

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
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "https://clarityco.co.uk"),
  title: {
    default: "Clarity & Co — Simplify Your UK Finances",
    template: "%s — Clarity & Co",
  },
  description: "Manage bank statements, invoices, HMRC tax reports, bills, and more. Free UK personal and business finance platform with AI-powered tools.",
  keywords: ["UK finance", "personal finance", "HMRC tax", "self assessment", "invoice management", "bank statements", "bill tracker", "financial projections", "Clarity & Co"],
  authors: [{ name: "Clarity & Co" }],
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    shortcut: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_GB",
    url: "https://clarityco.co.uk",
    siteName: "Clarity & Co",
    title: "Clarity & Co — Simplify Your UK Finances",
    description: "The all-in-one UK finance platform for individuals and small businesses. Bank statements, invoices, tax reports, secure vault, and AI tools.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Clarity & Co" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Clarity & Co — Simplify Your UK Finances",
    description: "The all-in-one UK finance platform for individuals and small businesses.",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Clarity & Co",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Clarity & Co",
              "url": "https://clarityco.co.uk",
              "applicationCategory": "FinanceApplication",
              "operatingSystem": "Web",
              "description": "All-in-one UK finance platform for individuals and small businesses. AI-powered bank statement processing, HMRC tax reports, invoice management, secure vault, identity verification, and real-time global intelligence.",
              "offers": {
                "@type": "AggregateOffer",
                "priceCurrency": "GBP",
                "lowPrice": "7.90",
                "highPrice": "99.90",
                "offerCount": "4"
              },
              "provider": {
                "@type": "Organization",
                "name": "Clarity & Co",
                "url": "https://clarityco.co.uk",
                "logo": "https://clarityco.co.uk/icon-512.png",
                "contactPoint": { "@type": "ContactPoint", "email": "admin@clarityco.co.uk", "contactType": "customer service" }
              },
              "featureList": ["Bank Statement Processing", "HMRC Tax Reports", "Invoice Management", "AI Categorisation", "Secure Vault", "Identity Verification", "Open Banking", "Global Intelligence Dashboard"]
            })
          }}
        />
      </head>
      <body className={`${inter.className} min-h-screen`} suppressHydrationWarning>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:outline-none focus:ring-2 focus:ring-ring">
          Skip to main content
        </a>
        <Providers>
          <AppShell>
            <main id="main-content" role="main" tabIndex={-1}>
              {children}
            </main>
          </AppShell>
          <CookieBanner />
          <SiteTracker />
          <AnalyticsTracker />
          <UserTracker />
          <InvisibleWatermark />
        </Providers>
      </body>
    </html>
  )
}
