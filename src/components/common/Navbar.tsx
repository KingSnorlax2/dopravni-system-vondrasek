import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/dashboard" className="text-xl font-bold text-black">
                Dopravní Systém
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                href="/dashboard" 
                className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Dashboard
              </Link>
              <Link 
                href="/dashboard/auta" 
                className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Auta
              </Link>
              <Link 
                href="/dashboard/transakce" 
                className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Transakce
              </Link>
              <Link 
                href="/dashboard/grafy" 
                className="text-gray-900 hover:text-gray-500 px-3 py-2 rounded-md text-sm font-medium"
              >
                Grafy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}