import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ConditionalNavbar from '@/components/layout/ConditionalNavbar'
import ClientProviders from '@/components/providers/ClientProviders'
import { PropsWithChildren } from 'react'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Mana - Your Learning Platform',
  description: 'Learn and grow with Mana',
}

export default function RootLayout({
  children,
}: PropsWithChildren) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-white min-h-screen text-gray-900`}>
        <ClientProviders>
          <ConditionalNavbar />
          {children}
        </ClientProviders>
      </body>
    </html>
  )
} 