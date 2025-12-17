import { getRepairs } from '@/app/actions/repairs'
import { RepairsTable } from '@/components/repairs/RepairsTable'
import { RepairDialog } from '@/components/repairs/RepairDialog'

export default async function RepairsPage() {
  const result = await getRepairs()

  if (!result.success) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="text-red-600">
          Chyba při načítání oprav: {result.error}
        </div>
      </div>
    )
  }

  const repairs = result.data || []

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Opravy</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Přehled všech oprav vozidel
          </p>
        </div>
        <RepairDialog />
      </div>

      <div className="rounded-lg border bg-card">
        <RepairsTable repairs={repairs} showVehicleColumn={true} />
      </div>
    </div>
  )
}
