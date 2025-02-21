import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Dopravní Systém',
  description: 'Systém pro správu vozového parku',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs">
      <body className={inter.className}>
        <SessionProvider>
          <main className="min-h-screen bg-gray-100">
            <div className="w-full">
              {children}
            </div>
          </main>
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  )
}