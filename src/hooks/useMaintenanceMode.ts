'use client'

import { useState, useEffect } from 'react'

/**
 * Returns true when Režim údržby (maintenance mode) is enabled.
 * Use to show dev-only UI (e.g. "Přidat náhodná vozidla", "Vytvořit admin účet")
 * only when the app is in maintenance mode.
 */
export function useMaintenanceMode(): boolean {
  const [maintenanceMode, setMaintenanceMode] = useState(false)

  useEffect(() => {
    fetch('/api/maintenance-status')
      .then((res) => res.json())
      .then((data) => setMaintenanceMode(data.maintenanceMode === true))
      .catch(() => setMaintenanceMode(false))
  }, [])

  return maintenanceMode
}
