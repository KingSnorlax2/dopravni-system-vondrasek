'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

const Sidebar = () => {
  const pathname = usePathname()
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

  const sidebarSections: SidebarSection[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    {
      name: 'Vehicles',
      href: '/dashboard/auta',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
        </svg>
      ),
      subcategories: [
        {
          name: 'Active Vehicles',
          href: '/dashboard/auta',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Service',
          href: '/dashboard/auta/servis',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )
        },
        {
          name: 'STK',
          href: '/dashboard/auta/stk',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )
        },
        {
          name: 'Archive',
          href: '/dashboard/auta/archiv',
          icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
            </svg>
          )
        }
      ]
    },
    {
      name: 'Transactions',
      href: '/dashboard/transakce',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm4 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      )
    },
    {
      name: 'Charts',
      href: '/dashboard/grafy',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  ]

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-900 to-purple-800 text-white shadow-2xl overflow-y-auto">
      <div className="sticky top-0 bg-purple-900 p-4 z-10 shadow-md">
        <h1 className="text-2xl font-bold text-center tracking-wider text-white">
          Dopravní systém
        </h1>
      </div>

      <nav className="p-4 space-y-2">
        {sidebarSections.map((section) => (
          <div key={section.name} className="group">
            <div 
              className={`
                flex items-center justify-between p-3 rounded-lg cursor-pointer 
                transition-all duration-300 ease-in-out
                ${expandedSection === section.name ? 'bg-purple-700' : 'hover:bg-purple-700'}
                ${isActive(section.href)}
              `}
              onClick={() => {
                section.subcategories ? toggleSection(section.name) : null
              }}
            >
              <Link 
                href={section.href} 
                className="flex items-center space-x-3 flex-grow"
              >
                <span className="w-6 h-6 flex items-center justify-center">
                  {section.icon}
                </span>
                <span className="font-medium">{section.name}</span>
              </Link>

              {section.subcategories && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation()
                    toggleSection(section.name)
                  }}
                  className="focus:outline-none"
                >
                  <svg 
                    className={`w-5 h-5 transform transition-transform duration-300 
                      ${expandedSection === section.name ? 'rotate-90' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            {section.subcategories && (
              <div className="pl-4 mt-2 space-y-1">
                {/* Always show favorited subcategories */}
                {section.subcategories
                  .filter(subcategory => favorites.includes(subcategory.href))
                  .map((subcategory) => (
                    <div 
                      key={subcategory.href} 
                      className="flex items-center group relative"
                    >
                      <Link 
                        href={subcategory.href} 
                        className={`
                          flex items-center w-full pl-10 py-2 rounded-lg 
                          transition-all duration-300 ease-in-out
                          ${isActive(subcategory.href)}
                          bg-purple-800/50 hover:bg-purple-700
                        `}
                      >
                        <span className="mr-3">{subcategory.icon}</span>
                        <span className="flex-grow">{subcategory.name}</span>
                        <span className="text-yellow-400 text-xs mr-2">★</span>
                      </Link>
                      <button 
                        onClick={(e) => toggleFavorite(subcategory.href, e)}
                        className="absolute right-2 focus:outline-none"
                      >
                        <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                    </div>
                  ))
                }

                {/* Expanded section non-favorited subcategories */}
                {expandedSection === section.name && (
                  <div className="animate-fade-in">
                    {section.subcategories
                      .filter(subcategory => !favorites.includes(subcategory.href))
                      .map((subcategory) => (
                        <div 
                          key={subcategory.href} 
                          className="flex items-center group relative"
                        >
                          <Link 
                            href={subcategory.href} 
                            className={`
                              flex items-center w-full pl-10 py-2 rounded-lg 
                              transition-all duration-300 ease-in-out
                              ${isActive(subcategory.href)}
                            `}
                          >
                            <span className="mr-3">{subcategory.icon}</span>
                            {subcategory.name}
                          </Link>
                          <button 
                            onClick={(e) => toggleFavorite(subcategory.href, e)}
                            className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 focus:outline-none"
                          >
                            {favorites.includes(subcategory.href) ? (
                              <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-gray-400 hover:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                            )}
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}

export default Sidebar
