import DriverLoginControl from '@/components/newspaper/DriverLoginControl'
import Overview from '@/app/newspaper/admin/overview/page'

export default async function NewspaperAdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div className="unified-section-header">
        <div>
          <h2 className="text-xl font-semibold">Nastavení novin – Administrace</h2>
          <p className="text-gray-600">Přístup řidičů a přehled aktivit</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div>
          <DriverLoginControl />
        </div>
        <div>
          <Overview />
        </div>
      </div>
    </div>
  )
}


