'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'

/**
 * Client Component - Displays 404 page for unauthenticated users
 */
export default function NotFoundClient() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-purple-800">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Stránka nenalezena</h2>
        <p className="text-gray-200">Požadovaná stránka neexistuje</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">
            Zpět na domovskou stránku
          </Link>
        </Button>
      </div>
    </div>
  )
}

