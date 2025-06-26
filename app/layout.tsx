import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const inter = Inter({ subsets: ["latin", "cyrillic"] })

export const metadata: Metadata = {
  title: "Статистика Приёмной Комиссии",
  description: "Статистика поданных заявлений абитуриентов в реальном времени",
  icons: {
    icon: '/favicon.png',
    // apple: '/apple-icon.png',
  },  
  openGraph: {
    title: "Статистика Приёмной Комиссии",
    description: "Статистика поданных заявлений абитуриентов в реальном времени",    
    type: 'website',
    images: [
      {
        url: 'https://stats-rgsu.vercel.app/og-image.png',
        width: 800,
        height: 600,
      },
    ],    
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html className="rounded-full" lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
