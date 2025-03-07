'use client';

import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-purple-900 to-purple-800">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-white">Page Not Found</h2>
        <p className="text-gray-200">Could not find the requested resource</p>
        <Button asChild variant="outline" className="mt-4">
          <Link href="/">
            Return Home
          </Link>
        </Button>
      </div>
    </div>
  )
} 