'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { Map, Lock } from "lucide-react"
import { useAccessControl } from "@/hooks/useAccessControl";

// Define types for better type safety
type Subcategory = {
  name: string
  href: string
  icon: React.ReactNode
}

type SidebarSection = {
  name: string
  href: string
  icon: React.ReactNode
  subcategories?: Subcategory[]
}

type AdminItem = {
  title: string
  href: string
  icon: React.ReactNode
}

const Sidebar = () => {
  const pathname = usePathname()
  const { data: session } = useSession()
  const { hasRole } = useAccessControl();
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])

  useEffect(() => {
    const storedFavorites = localStorage.getItem('sidebarFavorites')
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites))
    }
  }, [])

  const isActive = (path: string) => 
    pathname === path 
      ? 'bg-purple-700 text-white font-semibold' 
      : 'text-gray-300 hover:bg-purple-600 hover:text-white'

  const toggleSection = (section: string) => {
    setExpandedSection(prev => prev === section ? null : section)
  }

  const toggleFavorite = (href: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const updatedFavorites = favorites.includes(href)
      ? favorites.filter(fav => fav !== href)
      : [...favorites, href]
    
    setFavorites(updatedFavorites)
    localStorage.setItem('sidebarFavorites', JSON.stringify(updatedFavorites))
  }

  const adminItems: AdminItem[] = [
    {
      title: 'Uživatelé',
      href: '/dashboard/admin/users',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      )
    },
    {
      title: 'Nastavení',
      href: '/dashboard/admin/settings',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    }
  ]

  const sidebarSections: SidebarSection[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      name: 'Vehicles',
      href: '/dashboard/auta',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      subcategories: [
        {
          name: 'Active Vehicles',
          href: '/dashboard/auta',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Service',
          href: '/dashboard/auta/servis',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        },
        {
          name: 'STK',
          href: '/dashboard/auta/stk',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Archive',
          href: '/dashboard/auta/archiv',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          )
        },
        {
          name: 'Mapa',
          href: '/dashboard/auta/mapa',
          icon: (
            <Map className="mr-2 h-4 w-4" />
          )
        }
      ]
    },
    {
      name: 'Transactions',
      href: '/dashboard/transakce',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm4 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      )
    },
    {
      name: 'Charts',
      href: '/dashboard/grafy',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      name: 'Distribuce novin',
      href: '/newspaper',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1M19 20a2 2 0 002-2V8a2 2 0 00-2-2h-1M8 8h1M8 12h9m-9 4h9" />
        </svg>
      ),
      subcategories: [
        {
          name: 'Přehled',
          href: '/newspaper',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Aktuální distribuce',
          href: '/newspaper/active',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Plánování',
          href: '/newspaper/planning',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          )
        },
        {
          name: 'Vozidla',
          href: '/newspaper/vehicles',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
          )
        },
        {
          name: 'Statistiky',
          href: '/newspaper/statistics',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          )
        }
      ]
    },
    {
      name: 'Řidič - distribuce novin',
      href: '/dashboard/noviny/distribuce/driver-login',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 118 0v2m-4-6a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      )
    }
  ]

  // Only show admin items to ADMINs
  const visibleAdminItems = hasRole('ADMIN') ? adminItems : [];
  // Only show driver section to DRIVERs
  const visibleSidebarSections = sidebarSections.filter(section => {
    if (section.href.startsWith('/dashboard/admin')) {
      return hasRole('ADMIN');
    }
    if (section.href.startsWith('/dashboard/noviny/distribuce/driver-login')) {
      return hasRole('DRIVER');
    }
    // Add more role-based rules as needed
    return true;
  });

  // Helper to check if user can access a section
  const canAccessSection = (section: SidebarSection) => {
    if (section.href.startsWith('/dashboard/admin')) {
      return hasRole('ADMIN');
    }
    if (section.href.startsWith('/dashboard/noviny/distribuce/driver-login')) {
      return hasRole('DRIVER');
    }
    // Add more role-based rules as needed
    return true;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white shadow-2xl overflow-y-auto">
      <div className="sticky top-0 bg-purple-900 p-4 z-10 shadow-md">
        <h1 className="text-2xl font-bold text-center tracking-wider text-white">
          Dopravní systém
        </h1>
      </div>

      <nav className="flex flex-col h-[calc(100vh-80px)] justify-between p-3">
        <div className="space-y-2">
          {sidebarSections.map((section) => {
            const canAccess = canAccessSection(section);
            return (
              <div key={section.name} className="group">
                {canAccess ? (
                  <Link href={section.href} className={isActive(section.href) + " flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"}>
                    {section.icon}
                    <span>{section.name}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 cursor-not-allowed opacity-60">
                    {section.icon}
                    <span>{section.name}</span>
                    <Lock size={16} className="ml-1" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Admin section */}
          {visibleAdminItems.length > 0 && (
            <div className="mt-6">
              <div className="text-xs uppercase text-gray-400 px-3 mb-2">Admin</div>
              {visibleAdminItems.map((item) => (
                <Link key={item.href} href={item.href} className={isActive(item.href) + " flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200"}>
                  {item.icon}
                  <span>{item.title}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Account and Logout Section */}
        <div className="border-t border-purple-700 pt-4 mt-4 space-y-2">
          <Link
            href="/dashboard/account"
            className={`
              flex items-center px-3 py-2.5 rounded-lg
              transition-all duration-300 ease-in-out
              ${isActive('/dashboard/account') ? 'bg-purple-700 text-white' : 'text-gray-300 hover:bg-purple-700 hover:text-white'}
            `}
          >
            <span className="w-6 h-6 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <span className="text-base font-medium">Account Settings</span>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-gray-300 hover:bg-purple-700 hover:text-white transition-all duration-300 ease-in-out"
          >
            <span className="w-6 h-6 flex items-center justify-center mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </span>
            <span className="text-base font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default Sidebar
