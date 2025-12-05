import { getRepairs } from '@/app/actions/repairs'
import { RepairsTable } from '@/components/repairs/RepairsTable'

export default async function RepairsPage() {
  const result = await getRepairs()

  if (!result.success) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-red-600">
          Chyba při načítání oprav: {result.error}
        </div>
      </div>
    )
  }

  const repairs = result.data || []

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Opravy</h1>
          <p className="text-muted-foreground mt-1">
            Přehled všech oprav vozidel
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <RepairsTable repairs={repairs} showVehicleColumn={true} />
      </div>
    </div>
  )
}
