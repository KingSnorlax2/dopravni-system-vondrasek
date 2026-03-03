import { getAnalyticsData } from '@/lib/analytics'
import { GrafyPageClient } from '@/components/dashboard/GrafyPageClient'

/**
 * Server Component - Fetches analytics data directly from database
 * Renders GrafyPageClient with pre-fetched data
 */
export default async function GrafyPage() {
  let data
  try {
    data = await getAnalyticsData()
  } catch (error) {
    console.error('Chyba při načítání analytických dat:', error)
    return (
      <div className="unified-section-header">
        <h1 className="unified-section-title">Grafy a statistiky</h1>
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <p className="font-medium">Chyba při načítání dat</p>
          <p className="mt-1 text-sm">
            Nepodařilo se načíst analytická data. Zkuste to prosím znovu později.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="unified-section-header">
        <h1 className="unified-section-title">Grafy a statistiky</h1>
        <p className="unified-section-description">
          Analytický přehled vozového parku, financí a údržby.
        </p>
      </div>

      <GrafyPageClient data={data} />
    </>
  )
}
