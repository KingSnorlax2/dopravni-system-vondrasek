'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'

export function AdminLoginLink() {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    signOut({ callbackUrl: '/' })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-sm text-muted-foreground hover:underline"
    >
      Přihlásit se jako administrátor
    </button>
  )
}
