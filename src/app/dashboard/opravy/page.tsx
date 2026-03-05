import { getRepairs } from '@/app/actions/repairs'
import { OpravyPageClient } from './OpravyPageClient'

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

  return <OpravyPageClient repairs={repairs} />
}
