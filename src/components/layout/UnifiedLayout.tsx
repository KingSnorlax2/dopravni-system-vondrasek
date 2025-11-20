"use client"

import React from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, LogOut, Menu, ChevronDown, Shield, Users, Settings, Truck } from "lucide-react"
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

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
      name: 'Přihlášení řidiče',
      href: '/dashboard/noviny/distribuce/driver-login',
      icon: Truck,
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
    },
    {
      name: 'Nastavení přihlášení řidičů',
      href: '/dashboard/admin/driver-settings',
      icon: Truck
    },
    
  ]

  const mobileNavigationItems = hasRole('ADMIN')
    ? [
        ...navigationItems,
        {
          name: 'Admin',
          href: '/dashboard/admin/users',
          icon: Shield,
        },
      ]
    : navigationItems

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
                {/* Mobile & Tablet menu button */}
                {showNavigation && (
                  <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="lg:hidden"
                      >
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-full px-0 sm:max-w-sm">
                      <SheetHeader className="px-6 pt-6">
                        <SheetTitle className="flex items-center gap-3 text-xl">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Car className="h-5 w-5" />
                          </span>
                          {title}
                        </SheetTitle>
                        <SheetDescription>
                          {description || `Vítejte zpět, ${session?.user?.name || 'uživateli'}`}
                        </SheetDescription>
                      </SheetHeader>
                      <div className="px-6 py-6">
                        <nav className="space-y-6">
                          <div className="space-y-1">
                            {navigationItems.map((item) => (
                              <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center rounded-xl px-4 py-3 text-base font-medium ${
                                  isActive(item.href)
                                    ? 'bg-blue-50 text-blue-900'
                                    : 'text-gray-700 hover:bg-gray-50'
                                }`}
                                onClick={() => setIsMobileMenuOpen(false)}
                              >
                                <item.icon className="mr-3 h-5 w-5" />
                                {item.name}
                              </Link>
                            ))}
                          </div>

                          {hasRole('ADMIN') && (
                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                                Admin
                              </p>
                              <div className="space-y-1 rounded-2xl border border-gray-100 p-2">
                                {adminItems.map((item) => (
                                  <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center rounded-xl px-4 py-3 text-base font-medium ${
                                      isActive(item.href)
                                        ? 'bg-blue-50 text-blue-900'
                                        : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                  >
                                    <item.icon className="mr-3 h-5 w-5" />
                                    {item.name}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          )}
                        </nav>
                      </div>
                    </SheetContent>
                  </Sheet>
                )}

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
          </div>
        </header>
      )}

      {/* Main Content */}
      <main className="unified-main lg:pb-12">
        <div className="unified-main-content">
          {children}
        </div>
      </main>
    </div>
  )
}

export default UnifiedLayout 