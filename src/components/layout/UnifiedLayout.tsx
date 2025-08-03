"use client"

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, LogOut, Menu, X, ChevronDown, Shield, Users, Settings } from "lucide-react"
import Link from "next/link"
import { usePathname } from 'next/navigation'
import { useAccessControl } from "@/hooks/useAccessControl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface UnifiedLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
  showNavigation?: boolean
  showHeader?: boolean
}

const UnifiedLayout: React.FC<UnifiedLayoutProps> = ({
  children,
  title = "Dopravní Systém",
  description,
  showNavigation = true,
  showHeader = true
}) => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const { hasRole } = useAccessControl()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false)

  const navigationItems = [
    {
      name: 'Domů',
      href: '/homepage',
      icon: Car,
      show: true
    },
    {
      name: 'Vozidla',
      href: '/dashboard/auta',
      icon: Car,
      show: true
    },
    {
      name: 'Transakce',
      href: '/dashboard/transakce',
      icon: Car,
      show: true
    },
    {
      name: 'GPS Sledování',
      href: '/dashboard/auta/mapa',
      icon: Car,
      show: true
    },
    {
      name: 'Grafy',
      href: '/dashboard/grafy',
      icon: Car,
      show: true
    },
    {
      name: 'Noviny',
      href: '/dashboard/noviny',
      icon: Car,
      show: true
    }
  ].filter(item => item.show)

  const adminItems = [
    {
      name: 'Uživatelé',
      href: '/dashboard/admin/users',
      icon: Users
    },
    {
      name: 'Nastavení',
      href: '/dashboard/settings',
      icon: Settings
    }
  ]

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" })
  }

  const isActive = (path: string) => pathname === path

  const isAdminActive = () => {
    return adminItems.some(item => isActive(item.href))
  }

  if (status === "loading") {
    return (
      <div className="unified-loading">
        <div className="unified-spinner"></div>
      </div>
    )
  }

  if (!session) {
    router.push("/")
    return null
  }

  return (
    <div className="unified-page">
      {/* Header */}
      {showHeader && (
        <header className="unified-header">
          <div className="unified-header-content">
            <div className="unified-header-main">
              <div className="unified-header-brand">
                <div className="unified-header-logo">
                  <Car className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="unified-header-title">{title}</h1>
                  {description && (
                    <p className="unified-header-subtitle">{description}</p>
                  )}
                  {!description && (
                    <p className="unified-header-subtitle">
                      Vítejte zpět, {session?.user?.name || 'Uživateli'}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="unified-header-actions">
                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>

                {/* Desktop Navigation */}
                {showNavigation && (
                  <nav className="unified-nav">
                    {navigationItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`unified-nav-item ${
                          isActive(item.href)
                            ? 'unified-nav-item-active'
                            : 'unified-nav-item-inactive'
                        }`}
                      >
                        <item.icon className="mr-2 h-4 w-4" />
                        {item.name}
                      </Link>
                    ))}

                    {/* Admin Dropdown */}
                    {hasRole('ADMIN') && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className={`unified-nav-item ${
                              isAdminActive()
                                ? 'unified-nav-item-active'
                                : 'unified-nav-item-inactive'
                            }`}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Admin
                            <ChevronDown className="ml-2 h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          {adminItems.map((item) => (
                            <DropdownMenuItem key={item.href} asChild>
                              <Link
                                href={item.href}
                                className={`flex items-center ${
                                  isActive(item.href) ? 'bg-accent' : ''
                                }`}
                              >
                                <item.icon className="mr-2 h-4 w-4" />
                                {item.name}
                              </Link>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </nav>
                )}

                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  Online
                </Badge>
                
                <Button variant="outline" size="sm" onClick={handleSignOut}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Odhlásit
                </Button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {showNavigation && isMobileMenuOpen && (
              <div className="md:hidden mt-4 border-t pt-4">
                <nav className="space-y-2">
                  {navigationItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'unified-nav-item-active'
                          : 'unified-nav-item-inactive'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <item.icon className="mr-3 h-4 w-4" />
                      {item.name}
                    </Link>
                  ))}

                  {/* Mobile Admin Section */}
                  {hasRole('ADMIN') && (
                    <>
                      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Admin
                      </div>
                      {adminItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                            isActive(item.href)
                              ? 'unified-nav-item-active'
                              : 'unified-nav-item-inactive'
                          }`}
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          <item.icon className="mr-3 h-4 w-4" />
                          {item.name}
                        </Link>
                      ))}
                    </>
                  )}
                </nav>
              </div>
            )}
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="unified-main">
        {children}
      </main>
    </div>
  )
}

export default UnifiedLayout 