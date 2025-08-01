"use client"

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { 
  Car, 
  Users, 
  FileText, 
  MapPin, 
  BarChart3, 
  Settings,
  Newspaper,
  Menu,
  X,
  Home,
  User,
  Shield
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAccessControl } from "@/hooks/useAccessControl"

const HomepageNav = () => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { hasRole } = useAccessControl()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const navigationItems = [
    {
      name: 'Domů',
      href: '/homepage',
      icon: Home,
      show: true
    },
    {
      name: 'Vozidla',
      href: '/dashboard/auta',
      icon: Car,
      show: true
    },
    {
      name: 'Uživatelé',
      href: '/dashboard/users',
      icon: Users,
      show: hasRole('ADMIN')
    },
    {
      name: 'Transakce',
      href: '/dashboard/transakce',
      icon: FileText,
      show: true
    },
    {
      name: 'GPS Sledování',
      href: '/dashboard/auta/mapa',
      icon: MapPin,
      show: true
    },
    {
      name: 'Grafy',
      href: '/dashboard/grafy',
      icon: BarChart3,
      show: true
    },
    {
      name: 'Noviny',
      href: '/dashboard/noviny',
      icon: Newspaper,
      show: true
    },
    {
      name: 'Nastavení',
      href: '/dashboard/settings',
      icon: Settings,
      show: hasRole('ADMIN')
    },
    {
      name: 'Admin',
      href: '/dashboard/admin',
      icon: Shield,
      show: hasRole('ADMIN')
    }
  ].filter(item => item.show)

  const isActive = (path: string) => pathname === path

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white shadow-lg border-b z-50">
          <div className="px-4 py-2 space-y-1">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <item.icon className="mr-3 h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Desktop navigation */}
      <nav className="hidden md:flex items-center space-x-4">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <item.icon className="mr-2 h-4 w-4" />
            {item.name}
          </Link>
        ))}
      </nav>
    </>
  )
}

export default HomepageNav 