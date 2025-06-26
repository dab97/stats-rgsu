import type React from "react"
import type { Metadata } from "next"
import { Inter, Golos_Text } from "next/font/google"
import localFont from 'next/font/local'
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"

const golos = Golos_Text({ subsets: ["latin", "cyrillic"] })
const inter = Inter({ subsets: ["latin", "cyrillic"] })
const Angst = localFont({ src: 'fonts/AngstVF.ttf',})
const BebasNeue = localFont({ src: [
    { path: 'fonts/BebasNeue-Regular.ttf', weight: '400', },
    { path: 'fonts/BebasNeue-Bold.ttf', weight: '700', },
    { path: 'fonts/BebasNeue-Book.ttf', weight: '300',},    
  ],
})




export const metadata: Metadata = {
  title: "Статистика Приёмной Комиссии",
  description: "Статистика поданных заявлений абитуриентов в реальном времени",
  icons: {
    icon: '/favicon.ico',
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
      <body className={golos.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
