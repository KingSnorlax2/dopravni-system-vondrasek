export default function DashboardPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4 text-black">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-2 text-black">Přehled vozidel</h2>
          <p className="text-black">Celkový počet vozidel v systému</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow text-black">
          <h2 className="text-xl font-semibold mb-2 text-black">Transakce</h2>
          <p>Přehled posledních transakcí</p>
        </div>
      </div>
    </div>
  )
}
