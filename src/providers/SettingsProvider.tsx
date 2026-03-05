'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

const DEFAULT_PAGE_SIZE = 10

interface SettingsContextValue {
  defaultPageSize: number
  isLoading: boolean
}

const SettingsContext = createContext<SettingsContextValue>({
  defaultPageSize: DEFAULT_PAGE_SIZE,
  isLoading: true,
})

export function useDefaultPageSize(): number {
  const { defaultPageSize, isLoading } = useContext(SettingsContext)
  return isLoading ? DEFAULT_PAGE_SIZE : defaultPageSize
}

export function useSettingsLoading(): boolean {
  return useContext(SettingsContext).isLoading
}

export default function SettingsProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [defaultPageSize, setDefaultPageSize] = useState(DEFAULT_PAGE_SIZE)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/default-page-size')
      .then((res) => res.json())
      .then((data) => {
        const size = Number(data?.defaultPageSize)
        setDefaultPageSize(
          Number.isNaN(size) || size < 5 ? DEFAULT_PAGE_SIZE : Math.min(100, size)
        )
      })
      .catch(() => setDefaultPageSize(DEFAULT_PAGE_SIZE))
      .finally(() => setIsLoading(false))
  }, [])

  return (
    <SettingsContext.Provider value={{ defaultPageSize, isLoading }}>
      {children}
    </SettingsContext.Provider>
  )
}
