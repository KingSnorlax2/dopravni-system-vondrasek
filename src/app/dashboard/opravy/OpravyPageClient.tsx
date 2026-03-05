'use client'

import { useState } from 'react'
import { RepairsTable } from '@/components/repairs/RepairsTable'
import { RepairDialog } from '@/components/repairs/RepairDialog'
import { SendEmailButton } from '@/components/ui/send-email-button'
type RepairData = {
  id: number
  autoId: number
  kategorie: string
  popis: string
  datum: Date | string
  najezd: number
  poznamka: string | null
  cena: number | null
  auto?: { id: number; spz: string; znacka: string; model: string }
}

export function OpravyPageClient({ repairs }: { repairs: RepairData[] }) {
  const [selectedRepairIds, setSelectedRepairIds] = useState<number[]>([])

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Opravy</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Přehled všech oprav vozidel
          </p>
        </div>
        <div className="flex gap-2">
          <SendEmailButton
            reportType="repairs"
            variant="outline"
            size="sm"
            selectedIds={selectedRepairIds}
          />
          <RepairDialog />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <RepairsTable
          repairs={repairs}
          showVehicleColumn={true}
          selectedIds={selectedRepairIds}
          onSelectionChange={setSelectedRepairIds}
        />
      </div>
    </div>
  )
}
