"use client";

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/settings')
  }, [router])

  return (
    <div className="container py-6">
      <p>Přesměrování na novou stránku nastavení...</p>
    </div>
  )
} 