import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/index.css' // Reuse the global CSS if possible, though it might conflict with Tailwind base styles if duplicated. 
// For now, let's include it to see if we can get the styles working.

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Next.js Deployment',
    description: 'Deployed alongside existing Vite app',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
        </html>
    )
}
